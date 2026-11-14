import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Link2,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  ArrowRight,
  BookOpen,
  Headphones,
  Volume2,
} from 'lucide-react';
import { TRACK_CONFIG } from '../data/ecosystem';
import { TRACK_STUDY_MATERIALS } from '../data/trackMaterials';
import type { FocusAudioMode } from '../utils/focusAudio';
import type {
  ExamTrack,
  Flashcard,
  QuizQuestion,
  ScheduleBlock,
  StudySessionState,
  SubtopicItem,
} from '../types/mindforge';

interface StudyHubProps {
  track: ExamTrack;
  completedSyllabus: Record<string, boolean>;
  onToggleTrackSyllabus: (id: string) => void;
  audioMode: FocusAudioMode;
  audioVolume: number;
  onToggleAudio: (mode: 'brown' | 'alpha') => void;
  onStopAudio: () => void;
  onChangeAudioVolume: (val: number) => void;
  schedule: ScheduleBlock[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleBlock[]>>;
  availableMinutes: number;
  setAvailableMinutes: (m: number) => void;
  session: StudySessionState;
  onStartSession: (minutes: number, topic: string) => void;
  onEndSession: (voluntaryEarlyExit: boolean) => void;
  subtopics: SubtopicItem[];
  onToggleSubtopic: (subtopicId: string) => Promise<void>;
  loadingSubtopicId: string | null;
  onOpenLecture: (lectureId?: string) => void;
  onAddGeneratedPack: (flashcards: Flashcard[], quiz: QuizQuestion[]) => void;
  streakDays: number;
  onNavigateSection: (section: 'lectures' | 'knowledge' | 'recall' | 'arena' | 'deposit') => void;
}

const PRESET_DURATIONS = [20, 30, 45, 60, 90, 120];

export const StudyHub: React.FC<StudyHubProps> = ({
  track,
  completedSyllabus,
  onToggleTrackSyllabus,
  audioMode,
  audioVolume,
  onToggleAudio,
  onStopAudio,
  onChangeAudioVolume,
  schedule,
  setSchedule,
  availableMinutes,
  setAvailableMinutes,
  session,
  onStartSession,
  onEndSession,
  subtopics,
  onToggleSubtopic,
  loadingSubtopicId,
  onOpenLecture,
  onAddGeneratedPack,
  streakDays,
  onNavigateSection,
}) => {
  const trackMat = TRACK_STUDY_MATERIALS[track];
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>(trackMat.focusTopics[0]);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [scheduleSource, setScheduleSource] = useState<string>('');

  useEffect(() => {
    setSelectedTopic(TRACK_STUDY_MATERIALS[track].focusTopics[0]);
    setScheduleSource('');
  }, [track]);

  // Link-to-Notes AI state
  const [linkUrl, setLinkUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<{
    title: string;
    author: string;
    thumbnailUrl: string;
    url: string;
  } | null>(null);
  const [flippedExtractedCards, setFlippedExtractedCards] = useState<Record<number, boolean>>({});
  const [extractedNotes, setExtractedNotes] = useState<{
    title: string;
    shortNotes: string[];
    definitions: string[];
    formulas: string[];
    takeaways: string[];
    flashcards: Array<{ front: string; back: string }>;
  } | null>(null);

  const totalScheduledMinutes = schedule.reduce((sum, b) => sum + b.durationMinutes, 0);
  const completedSubtopicsCount = subtopics.filter((s) => s.completed).length;
  const averageMastery = Math.round(
    subtopics.reduce((sum, s) => sum + s.masteryScore, 0) / Math.max(1, subtopics.length)
  );

  const handleGenerateSchedule = async (minutes: number) => {
    setAvailableMinutes(minutes);
    setGeneratingSchedule(true);
    try {
      const weakAreas = subtopics.filter((s) => s.masteryScore < 75).map((s) => s.title);
      const res = await fetch('/api/ai/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes, topic: selectedTopic, weakAreas }),
      });
      const data = await res.json();
      if (Array.isArray(data.blocks)) {
        setSchedule(data.blocks);
        setScheduleSource(data.source === 'gemini' ? 'AI Personalized' : 'Adaptive Plan');
      }
    } catch {
      // Keep existing schedule on transient network issue
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutes, 10);
    if (!Number.isNaN(val) && val >= 10 && val <= 240) {
      handleGenerateSchedule(val);
    }
  };

  const adjustBlockMinutes = (id: string, delta: number) => {
    setSchedule((prev) => {
      const currentTotal = prev.reduce((s, b) => s + b.durationMinutes, 0);
      return prev.map((b) => {
        if (b.id !== id) return b;
        const next = b.durationMinutes + delta;
        if (next < 3) return b;
        if (b.activityType === 'lecture' && next > 20) return b;
        if (delta > 0 && currentTotal + delta > availableMinutes) return b;
        return { ...b, durationMinutes: next };
      });
    });
  };

  const toggleBlockComplete = (id: string) => {
    setSchedule((prev) =>
      prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b))
    );
  };

  const removeBlock = (id: string) => {
    setSchedule((prev) => prev.filter((b) => b.id !== id));
  };

  const extractFromSource = async (targetUrl: string, targetText: string) => {
    setLinkError(null);
    setLinkLoading(true);
    setFlippedExtractedCards({});
    try {
      const res = await fetch('/api/ai/link-to-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, pastedTranscript: targetText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLinkError(data.error || 'Could not extract notes from this source.');
        return;
      }
      setVideoMeta(data.videoMeta || null);
      setExtractedNotes(data.notes);
      if (Array.isArray(data.notes?.flashcards)) {
        const cards: Flashcard[] = data.notes.flashcards.map((c: any, idx: number) => ({
          id: `fc-link-${Date.now()}-${idx}`,
          subtopicTitle: data.notes.title || 'YouTube Lecture Notes',
          category: 'Concept',
          front: c.front,
          back: c.back,
        }));
        onAddGeneratedPack(cards, []);
      }
    } catch {
      setLinkError('Network error while extracting notes.');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleExtractNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    await extractFromSource(linkUrl, pastedText);
  };

  const handleDownloadExtractedNotes = () => {
    if (!extractedNotes) return;
    const text = [
      extractedNotes.title,
      videoMeta ? `Source: ${videoMeta.url} (${videoMeta.author})` : '',
      '',
      'SHORT NOTES',
      ...extractedNotes.shortNotes.map((n) => `- ${n}`),
      '',
      'DEFINITIONS',
      ...extractedNotes.definitions.map((d) => `- ${d}`),
      '',
      'KEY FORMULAS',
      ...extractedNotes.formulas.map((f) => `- ${f}`),
      '',
      'EXAM TAKEAWAYS',
      ...extractedNotes.takeaways.map((t) => `- ${t}`),
      '',
      'FLASHCARDS',
      ...extractedNotes.flashcards.map((c, idx) => `Q${idx + 1}: ${c.front}\nA${idx + 1}: ${c.back}\n`),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = 'mindforge-youtube-notes.txt';
    a.click();
    URL.revokeObjectURL(dlUrl);
  };

  const formatCountdown = () => {
    const totalSec = Math.max(0, session.plannedMinutes * 60 - session.elapsedSeconds);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Primary Hero / Time-Adaptive Study Prompt */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5e5240] dark:text-[#c5b79e] mb-3">
              <span className="px-2 py-0.5 rounded bg-[#8b673c]/15 dark:bg-[#c3a47b]/15 text-[#8b673c] dark:text-[#c3a47b] font-semibold">
                {trackMat.label}
              </span>
              <span>Micro-lectures capped at 20 min</span>
              <span className="tabular-nums">{streakDays}-day consistency streak</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#29251d] dark:text-[#eee2ca] max-w-2xl [text-wrap:balance]">
              How much uninterrupted time do you have available to study right now?
            </h1>
            <p className="mt-2 text-sm text-[#5e5240] dark:text-[#c5b79e] max-w-xl">
              Select your exact window. MindForge builds a realistic sequence of micro-lectures, active recall, quizzes, and breaks that never exceeds your available time.
            </p>

            {/* Duration Presets */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {PRESET_DURATIONS.map((mins) => {
                const active = availableMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleGenerateSchedule(mins)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                      active
                        ? 'bg-[#8b673c] text-[#fbf6ea] border-[#8b673c] dark:bg-[#c3a47b] dark:text-[#1d1a15] dark:border-[#c3a47b]'
                        : 'bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#c5b79e] border-[#d6c8ab] dark:border-[#c3a47b]/25 hover:border-[#8b673c] dark:hover:border-[#c3a47b]'
                    }`}
                  >
                    {mins} min
                  </button>
                );
              })}

              <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Custom min"
                  aria-label="Custom study duration in minutes"
                  className="w-28 px-3 py-2 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#c3a47b]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Apply
                </button>
              </form>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#e5d9bf] dark:border-[#c3a47b]/15 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label htmlFor="focus-topic-select" className="text-xs font-medium text-[#5e5240] dark:text-[#c5b79e]">
                Focus Topic
              </label>
              <select
                id="focus-topic-select"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca] focus:outline-none focus:ring-2 focus:ring-[#c3a47b]"
              >
                {trackMat.focusTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            {!session.active ? (
              <button
                type="button"
                onClick={() => onStartSession(availableMinutes, selectedTopic)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Start {availableMinutes}-Min Session
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEndSession(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#5f684f] hover:bg-[#4e5640] dark:text-[#1d1a15] dark:bg-[#89946f] dark:hover:bg-[#9aa67e] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Complete Session
                </button>
                <button
                  type="button"
                  onClick={() => onEndSession(true)}
                  className="px-3.5 py-2 text-xs font-medium text-[#945a3e] dark:text-[#d98c6e] border border-[#945a3e]/40 dark:border-[#d98c6e]/40 hover:bg-[#eadfc7] dark:hover:bg-[#343025] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  End Early
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Live Accountability Timer & Guardian Notice */}
        <div className="lg:col-span-4 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#5e5240] dark:text-[#c5b79e]">
              <span>Session &amp; Guardian Sync</span>
              <span className="font-mono tabular-nums text-[#8b673c] dark:text-[#c3a47b]">
                {session.active ? 'LIVE' : 'STANDBY'}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-4xl font-bold font-mono tabular-nums tracking-tight text-[#29251d] dark:text-[#eee2ca]">
                {session.active ? formatCountdown() : `${String(availableMinutes).padStart(2, '0')}:00`}
              </div>
              <p className="mt-1 text-xs text-[#5e5240] dark:text-[#c5b79e]">
                {session.active
                  ? `Active: ${session.topicTitle} · Expected end ${session.expectedEndLabel}`
                  : 'Starting a session notifies your verified guardian of expected completion time.'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#e5d9bf] dark:border-[#c3a47b]/15 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-[#5e5240] dark:text-[#c5b79e]">
              <span>Subtopics Checked</span>
              <span className="font-mono tabular-nums font-medium text-[#29251d] dark:text-[#eee2ca]">
                {completedSubtopicsCount} / {subtopics.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#5e5240] dark:text-[#c5b79e]">
              <span>Verified Mastery Avg</span>
              <span className="font-mono tabular-nums font-medium text-[#29251d] dark:text-[#eee2ca]">{averageMastery}%</span>
            </div>
            <div className="flex items-center justify-between text-[#5e5240] dark:text-[#c5b79e]">
              <span>70% Deposit Safeguarded</span>
              <button
                type="button"
                onClick={() => onNavigateSection('deposit')}
                className="font-mono tabular-nums font-semibold text-[#8b673c] dark:text-[#c3a47b] hover:underline cursor-pointer"
              >
                ₹700 / ₹1,000
              </button>
            </div>

            {/* Web Audio DSP Acoustic Focus Masking */}
            <div className="pt-3 mt-2 border-t border-[#e5d9bf] dark:border-[#c3a47b]/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 font-medium text-[#29251d] dark:text-[#eee2ca]">
                  <Headphones className="w-3.5 h-3.5 text-[#8b673c] dark:text-[#c3a47b]" />
                  Acoustic Focus DSP
                </span>
                <span className="font-mono text-[11px] text-[#5f684f] dark:text-[#89946f]">
                  {audioMode === 'off'
                    ? 'Muted'
                    : audioMode === 'brown'
                    ? 'Brown Noise'
                    : '40Hz Alpha'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onToggleAudio('brown')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                    audioMode === 'brown'
                      ? 'bg-[#8b673c] text-[#fbf6ea] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                      : 'border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca]'
                  }`}
                >
                  Brown Noise
                </button>
                <button
                  type="button"
                  onClick={() => onToggleAudio('alpha')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                    audioMode === 'alpha'
                      ? 'bg-[#8b673c] text-[#fbf6ea] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                      : 'border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca]'
                  }`}
                >
                  40Hz Alpha
                </button>
                {audioMode !== 'off' && (
                  <button
                    type="button"
                    onClick={onStopAudio}
                    className="px-2 py-1 rounded-md text-[11px] font-semibold bg-[#a96346]/15 dark:bg-[#d98c6e]/20 text-[#a96346] dark:text-[#d98c6e] cursor-pointer"
                  >
                    Stop
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#5e5240] dark:text-[#c5b79e]">
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={audioVolume}
                  onChange={(e) => onChangeAudioVolume(Number(e.target.value))}
                  aria-label="Focus audio volume"
                  className="flex-1 accent-[#8b673c] dark:accent-[#c3a47b]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Core Workspace: Editable Schedule + Subtopic Checklist */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editable Generated Study Schedule */}
        <div className="lg:col-span-6 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
            <div>
              <h2 className="text-lg font-semibold text-[#29251d] dark:text-[#eee2ca]">
                Today&apos;s Adaptive Schedule
              </h2>
              <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
                {scheduleSource ? `${scheduleSource} · ` : ''}Adjust durations before starting · Cap {availableMinutes} min
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono tabular-nums font-medium text-[#29251d] dark:text-[#eee2ca]">
                {totalScheduledMinutes} / {availableMinutes}m
              </span>
              <button
                type="button"
                onClick={() => handleGenerateSchedule(availableMinutes)}
                disabled={generatingSchedule}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {generatingSchedule ? 'Building...' : 'Regenerate'}
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#e5d9bf] dark:divide-[#c3a47b]/15 mt-2">
            {schedule.map((block) => (
              <div
                key={block.id}
                className="py-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleBlockComplete(block.id)}
                    aria-label={`Mark ${block.title} completed`}
                    className="mt-0.5 text-[#8b673c] dark:text-[#c3a47b] hover:opacity-80 cursor-pointer shrink-0"
                  >
                    {block.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#5f684f] dark:text-[#89946f]" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${
                        block.completed
                          ? 'line-through text-[#8c7e6a] dark:text-[#c5b79e]/50'
                          : 'text-[#29251d] dark:text-[#eee2ca]'
                      }`}
                    >
                      {block.title}
                    </div>
                    <div className="text-xs text-[#5e5240] dark:text-[#c5b79e] flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{block.activityType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{block.subtopic}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => adjustBlockMinutes(block.id, -2)}
                    aria-label="Decrease block minutes"
                    className="w-7 h-7 rounded border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-xs font-mono text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-11 text-center text-xs font-mono tabular-nums text-[#29251d] dark:text-[#eee2ca]">
                    {block.durationMinutes}m
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustBlockMinutes(block.id, 2)}
                    aria-label="Increase block minutes"
                    className="w-7 h-7 rounded border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-xs font-mono text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer"
                  >
                    +
                  </button>
                  {block.activityType === 'lecture' && (
                    <button
                      type="button"
                      onClick={() => onOpenLecture(block.lectureId)}
                      className="ml-1 px-2.5 py-1.5 text-xs font-medium text-[#8b673c] dark:text-[#c3a47b] hover:bg-[#eadfc7] dark:hover:bg-[#343025] rounded-md whitespace-nowrap cursor-pointer"
                    >
                      Open
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    aria-label="Remove schedule block"
                    className="p-1.5 text-[#8c7e6a] hover:text-[#945a3e] dark:hover:text-[#d98c6e] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subtopic Completion System (Auto-generates Flashcards + 5-Min Quiz) */}
        <div className="lg:col-span-6 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
            <div>
              <h2 className="text-lg font-semibold text-[#29251d] dark:text-[#eee2ca]">
                Subtopic Checklist: Semiconductor Physics
              </h2>
              <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
                Completing a subtopic generates AI flashcards &amp; a 5-min quiz. Mastery requires passing recall.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('recall')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#8b673c] dark:text-[#c3a47b] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Recall Deck
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#e5d9bf] dark:divide-[#c3a47b]/15 mt-2">
            {subtopics.map((sub) => {
              const isGenerating = loadingSubtopicId === sub.id;
              return (
                <div
                  key={sub.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <label className="flex items-start gap-3 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      disabled={isGenerating}
                      onChange={() => onToggleSubtopic(sub.id)}
                      className="mt-1 h-4 w-4 rounded border-[#d6c8ab] dark:border-[#c3a47b]/40 accent-[#8b673c] dark:accent-[#c3a47b] cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#29251d] dark:text-[#eee2ca]">
                        {sub.title}
                      </div>
                      <div className="text-xs text-[#5e5240] dark:text-[#c5b79e] flex items-center gap-2 mt-0.5">
                        <span className="tabular-nums">{sub.durationMinutes} min lecture</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {isGenerating
                            ? 'Generating AI flashcards & 5-min quiz...'
                            : sub.completed
                            ? 'Pack ready in Recall & Lab'
                            : 'Check to generate AI recall pack'}
                        </span>
                      </div>
                    </div>
                  </label>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono tabular-nums font-semibold text-[#29251d] dark:text-[#eee2ca]">
                      {sub.masteryScore}%
                    </div>
                    <div className="text-[11px] text-[#5e5240] dark:text-[#c5b79e]">
                      {sub.masteryScore >= 75
                        ? 'Mastered'
                        : sub.completed
                        ? 'Quiz Pending'
                        : 'Not Started'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* YouTube & Link-to-Notes AI Extractor */}
      <section className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
          <div>
            <h2 className="text-lg font-semibold text-[#29251d] dark:text-[#eee2ca]">
              YouTube &amp; Link-to-Notes AI Generator
            </h2>
            <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
              Paste any YouTube lecture URL (`youtube.com/watch?v=...` or `youtu.be/...`) or educational link to automatically generate structured notes, formulas, and flashcards.
            </p>
          </div>
          <span className="text-xs text-[#5e5240] dark:text-[#c5b79e] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#8b673c] dark:text-[#c3a47b]" />
            YouTube Video &amp; Transcript AI
          </span>
        </div>

        <form onSubmit={handleExtractNotes} className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-3">
            <div>
              <label htmlFor="source-url" className="block text-xs font-medium text-[#29251d] dark:text-[#eee2ca] mb-1">
                YouTube Video Link or Educational Article URL
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b] absolute left-3 top-2.5" />
                <input
                  id="source-url"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=WUvTyaaNkzM"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca] focus:outline-none focus:ring-2 focus:ring-[#c3a47b]"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#5e5240] dark:text-[#c5b79e]">
                <span>Try sample:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'https://www.youtube.com/watch?v=WUvTyaaNkzM';
                    setLinkUrl(sample);
                    extractFromSource(sample, pastedText);
                  }}
                  className="text-[#8b673c] dark:text-[#c3a47b] hover:underline cursor-pointer"
                >
                  Essence of Calculus
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'https://www.youtube.com/watch?v=7ukDKVHnac4';
                    setLinkUrl(sample);
                    extractFromSource(sample, pastedText);
                  }}
                  className="text-[#8b673c] dark:text-[#c3a47b] hover:underline cursor-pointer"
                >
                  How Transistors Work
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="pasted-transcript" className="block text-xs font-medium text-[#29251d] dark:text-[#eee2ca] mb-1">
                Optional Transcript / Excerpt (for private videos or custom notes)
              </label>
              <textarea
                id="pasted-transcript"
                rows={3}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Optional: paste specific transcript lines or textbook notes..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca] focus:outline-none focus:ring-2 focus:ring-[#c3a47b]"
              />
            </div>
            <button
              type="submit"
              disabled={linkLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {linkLoading ? 'Analyzing Video & Generating Notes...' : 'Generate Notes & Flashcards'}
            </button>

            {linkError && (
              <div className="p-3 rounded-lg border border-[#945a3e]/40 dark:border-[#d98c6e]/40 bg-[#eadfc7] dark:bg-[#343025] text-xs text-[#945a3e] dark:text-[#d98c6e] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{linkError}</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-lg p-4 bg-[#f4ecd8]/70 dark:bg-[#1d1a15]/80">
            {extractedNotes ? (
              <div className="space-y-4 text-xs">
                {videoMeta && (
                  <div className="flex items-center gap-3 pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
                    <img
                      src={videoMeta.thumbnailUrl}
                      alt={videoMeta.title}
                      referrerPolicy="no-referrer"
                      className="w-24 h-14 object-cover rounded-md shrink-0 bg-[#343025]"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[#29251d] dark:text-[#eee2ca] truncate">
                        {videoMeta.title}
                      </div>
                      <div className="text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
                        {videoMeta.author} · YouTube Lecture
                      </div>
                    </div>
                  </div>
                )}

                {!videoMeta && (
                  <div className="font-semibold text-sm text-[#29251d] dark:text-[#eee2ca]">
                    {extractedNotes.title}
                  </div>
                )}

                <div>
                  <div className="font-medium text-[#29251d] dark:text-[#eee2ca] mb-1">Structured Notes</div>
                  <ul className="list-disc pl-4 space-y-1 text-[#5e5240] dark:text-[#c5b79e]">
                    {extractedNotes.shortNotes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#e5d9bf] dark:border-[#c3a47b]/15">
                  <div>
                    <div className="font-medium text-[#29251d] dark:text-[#eee2ca] mb-1">Definitions</div>
                    <ul className="space-y-1 text-[#5e5240] dark:text-[#c5b79e]">
                      {extractedNotes.definitions.map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-[#29251d] dark:text-[#eee2ca] mb-1">Key Formulas &amp; Rules</div>
                    <ul className="space-y-1 font-mono text-[#29251d] dark:text-[#eee2ca]">
                      {extractedNotes.formulas.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Inline Generated Flashcards Preview */}
                {extractedNotes.flashcards.length > 0 && (
                  <div className="pt-3 border-t border-[#e5d9bf] dark:border-[#c3a47b]/15 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#29251d] dark:text-[#eee2ca]">
                        Generated Flashcards (Click to Flip)
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateSection('recall')}
                        className="text-[#8b673c] dark:text-[#c3a47b] hover:underline font-medium cursor-pointer"
                      >
                        Practice in Recall Deck →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {extractedNotes.flashcards.map((fc, idx) => {
                        const flipped = Boolean(flippedExtractedCards[idx]);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setFlippedExtractedCards((prev) => ({ ...prev, [idx]: !prev[idx] }))
                            }
                            className="text-left p-3 rounded-lg bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 hover:border-[#8b673c] dark:hover:border-[#c3a47b] transition-colors cursor-pointer"
                          >
                            <div className="text-[11px] font-medium text-[#8b673c] dark:text-[#c3a47b] mb-1">
                              Card {idx + 1} · {flipped ? 'Answer' : 'Prompt'}
                            </div>
                            <div className="text-[#29251d] dark:text-[#eee2ca] leading-relaxed">
                              {flipped ? fc.back : fc.front}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[#5f684f] dark:text-[#89946f] font-medium flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    {extractedNotes.flashcards.length} flashcard(s) added to your active Recall Deck.
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadExtractedNotes}
                    className="px-3 py-1.5 rounded-md border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] font-medium cursor-pointer"
                  >
                    Download Notes (.txt)
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 text-xs text-[#5e5240] dark:text-[#c5b79e]">
                <Clock className="w-6 h-6 mb-2 text-[#8b673c] dark:text-[#c3a47b]" />
                <p className="max-w-sm">
                  Paste any YouTube video link above to generate structured study notes, definitions, formulas, and interactive flashcards.
                </p>
              </div>
            )}
          </div>
        </form>
      </section>

      {/* Track-Adaptive High-Yield Syllabus Mastery Tracker */}
      {(() => {
        const trackSyllabus = TRACK_CONFIG[track].syllabus;
        const doneCount = trackSyllabus.filter((s) => Boolean(completedSyllabus[s.id])).length;
        return (
          <section className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  {TRACK_CONFIG[track].badge} · High-Yield Syllabus Mastery
                </h2>
                <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
                  Check off completed syllabus units to earn +50 XP and advance your 70% Refundable Completion Deposit.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#8b673c]/15 dark:bg-[#c3a47b]/15 text-[#8b673c] dark:text-[#c3a47b] text-xs font-mono font-bold">
                {doneCount} / {trackSyllabus.length} Completed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trackSyllabus.map((item) => {
                const checked = Boolean(completedSyllabus[item.id]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleTrackSyllabus(item.id)}
                    className={`p-3.5 rounded-lg border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                      checked
                        ? 'border-[#5f684f]/40 dark:border-[#89946f]/40 bg-[#f4ecd8] dark:bg-[#1d1a15]'
                        : 'border-[#e5d9bf] dark:border-[#c3a47b]/15 bg-[#f4ecd8] dark:bg-[#1d1a15] hover:border-[#8b673c] dark:hover:border-[#c3a47b]'
                    }`}
                  >
                    {checked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#5f684f] dark:text-[#89946f] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b] shrink-0" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        checked
                          ? 'line-through text-[#7c6e58] dark:text-[#8f826c]'
                          : 'text-[#29251d] dark:text-[#eee2ca]'
                      }`}
                    >
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })()}
    </div>
  );
};
