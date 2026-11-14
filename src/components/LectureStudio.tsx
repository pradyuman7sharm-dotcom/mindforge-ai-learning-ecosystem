import React, { useEffect, useState } from 'react';
import {
  Download,
  FileText,
  HelpCircle,
  MessageSquare,
  Mic,
  Pause,
  Play,
  Send,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { LECTURE_CATALOG } from '../data/curriculum';
import { EducatorClassroom } from './EducatorClassroom';
import type {
  ExamTrack,
  ExplanationLevel,
  LectureItem,
  TimestampNote,
} from '../types/mindforge';

interface LectureStudioProps {
  track: ExamTrack;
  activeLectureId: string;
  setActiveLectureId: (id: string) => void;
  notes: TimestampNote[];
  onAddNote: (note: TimestampNote) => void;
  educatorNotes: Array<{ id: number; text: string }>;
  onAddEducatorNote: (text: string) => void;
  onDeleteEducatorNote: (id: number) => void;
  onOpenKnowledgeVault: () => void;
}

const QUALITIES = ['240p', '360p', '480p', '720p', '1080p'];
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export const LectureStudio: React.FC<LectureStudioProps> = ({
  track,
  activeLectureId,
  setActiveLectureId,
  notes,
  onAddNote,
  educatorNotes,
  onAddEducatorNote,
  onDeleteEducatorNote,
  onOpenKnowledgeVault,
}) => {
  const [studioMode, setStudioMode] = useState<'classroom' | 'micro'>('classroom');
  const lecture: LectureItem =
    LECTURE_CATALOG.find((l) => l.id === activeLectureId) || LECTURE_CATALOG[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(lecture.resumeSeconds);
  const [quality, setQuality] = useState('720p');
  const [speed, setSpeed] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [level, setLevel] = useState<ExplanationLevel>(lecture.level);

  // Filter Khazana archive
  const [archiveFilter, setArchiveFilter] = useState<'All' | 'Physics' | 'Intermediate'>('All');

  // Notes state
  const [writtenDraft, setWrittenDraft] = useState('');
  const [recordingVoice, setRecordingVoice] = useState(false);

  // Instant ASK AI inside player
  const [askInput, setAskInput] = useState('');
  const [askReply, setAskReply] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);

  // First-principles WHY Drill-down
  const [selectedWhyId, setSelectedWhyId] = useState<string>(
    lecture.formulasForWhy[0]?.id || ''
  );

  useEffect(() => {
    setCurrentSeconds(lecture.resumeSeconds);
    setIsPlaying(false);
    setSelectedWhyId(lecture.formulasForWhy[0]?.id || '');
    setAskReply(null);
  }, [lecture.id]);

  useEffect(() => {
    if (!isPlaying) return;
    const totalSec = lecture.durationMinutes * 60;
    const id = window.setInterval(() => {
      setCurrentSeconds((prev) => {
        if (prev + 1 >= totalSec) {
          setIsPlaying(false);
          return totalSec;
        }
        return prev + 1;
      });
    }, Math.round(1000 / speed));
    return () => window.clearInterval(id);
  }, [isPlaying, speed, lecture.durationMinutes]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalSec = lecture.durationMinutes * 60;
  const currentTranscript =
    [...lecture.transcript].reverse().find((t) => currentSeconds >= t.seconds) ||
    lecture.transcript[0];

  const handleSaveWrittenNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writtenDraft.trim()) return;
    onAddNote({
      id: `note-${Date.now()}`,
      lectureId: lecture.id,
      timestampSeconds: currentSeconds,
      timestampLabel: formatTime(currentSeconds),
      type: 'written',
      content: writtenDraft.trim(),
      createdAt: 'Just now',
    });
    setWrittenDraft('');
  };

  const handleVoiceMemoToggle = () => {
    if (!recordingVoice) {
      setRecordingVoice(true);
      return;
    }
    setRecordingVoice(false);
    onAddNote({
      id: `voice-${Date.now()}`,
      lectureId: lecture.id,
      timestampSeconds: currentSeconds,
      timestampLabel: formatTime(currentSeconds),
      type: 'voice',
      content: `Voice memo saved at ${formatTime(currentSeconds)}: Key concept reminder on ${lecture.subtopicTitle}.`,
      durationLabel: '0:14',
      createdAt: 'Just now',
    });
  };

  const handleAskAtTimestamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askInput.trim()) return;
    setAskLoading(true);
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'lecture',
          message: askInput,
          context: `${lecture.topicTitle} — ${lecture.subtopicTitle} at ${formatTime(currentSeconds)}. Transcript segment: "${currentTranscript?.line || ''}"`,
        }),
      });
      const data = await res.json();
      setAskReply(data.reply || data.error || 'No response received.');
    } catch {
      setAskReply('Could not reach AI Tutor right now.');
    } finally {
      setAskLoading(false);
    }
  };

  const handleDownloadMaterial = (kind: 'Formula Sheet' | 'Lecture Notes' | 'DPP Practice') => {
    const exp = lecture.explanations[level];
    const content = [
      `MINDFORGE STUDY MATERIAL — ${kind.toUpperCase()}`,
      `Course Topic: ${lecture.topicTitle}`,
      `Subtopic: ${lecture.subtopicTitle} (${lecture.durationMinutes} min)`,
      `Instructor: ${lecture.instructor}`,
      `Level: ${level}`,
      '',
      'CONCEPT SUMMARY',
      exp.summary,
      '',
      'KEY FORMULA',
      exp.keyFormula,
      '',
      'DERIVATION & INSIGHT',
      exp.derivationNote,
      '',
      'EXAM HIGHLIGHTS',
      ...lecture.highlights.map((h) => `[${h.timeLabel}] (${h.tag}) ${h.text}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lecture.id}-${kind.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lectureNotes = notes.filter((n) => n.lectureId === lecture.id);
  const selectedWhy = lecture.formulasForWhy.find((f) => f.id === selectedWhyId);

  const filteredArchive = LECTURE_CATALOG.filter((item) => {
    if (archiveFilter === 'Physics') return item.subject === 'Physics';
    if (archiveFilter === 'Intermediate') return item.level === 'Intermediate';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Studio Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#dccfb4] dark:border-[#c3a47b]/20">
        <div className="flex items-center gap-1 p-1 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-lg">
          <button
            type="button"
            onClick={() => setStudioMode('classroom')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              studioMode === 'classroom'
                ? 'bg-[#29251d] text-[#eee2ca] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                : 'text-[#5e5240] dark:text-[#c5b79e] hover:text-[#29251d] dark:hover:text-[#eee2ca]'
            }`}
          >
            Real Teacher Classroom &amp; Whiteboard
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('micro')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              studioMode === 'micro'
                ? 'bg-[#29251d] text-[#eee2ca] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                : 'text-[#5e5240] dark:text-[#c5b79e] hover:text-[#29251d] dark:hover:text-[#eee2ca]'
            }`}
          >
            20-Min Micro-Lecture &amp; WHY Studio
          </button>
        </div>

        {studioMode === 'micro' && (
          <div className="flex items-center gap-1 p-1 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-lg">
            {(['All', 'Physics', 'Intermediate'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setArchiveFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  archiveFilter === tab
                    ? 'bg-[#29251d] text-[#eee2ca] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                    : 'text-[#5e5240] dark:text-[#c5b79e] hover:text-[#29251d] dark:hover:text-[#eee2ca]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {studioMode === 'classroom' ? (
        <EducatorClassroom
          track={track}
          savedNotes={educatorNotes}
          onAddNote={onAddEducatorNote}
          onDeleteNote={onDeleteEducatorNote}
          onOpenKnowledgeVault={onOpenKnowledgeVault}
        />
      ) : (
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#29251d] dark:text-[#eee2ca]">
              Micro-Lecture Studio &amp; Khazana Archive
            </h1>
            <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
              Ad-free 20-minute micro-lectures with timestamped notes, AI highlights, and first-principles formula trees.
            </p>
          </div>

      {/* Lecture Switcher Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArchive.map((item) => {
          const active = item.id === lecture.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveLectureId(item.id)}
              className={`text-left p-4 rounded-xl border transition-colors flex items-center gap-4 cursor-pointer ${
                active
                  ? 'bg-[#fbf6ea] dark:bg-[#211e18] border-[#8b673c] dark:border-[#c3a47b] ring-1 ring-[#c3a47b]/40'
                  : 'bg-[#fbf6ea] dark:bg-[#211e18] border-[#dccfb4] dark:border-[#c3a47b]/20 hover:border-[#8b673c] dark:hover:border-[#c3a47b]/60'
              }`}
            >
              <img
                src={item.thumbnail}
                alt={item.subtopicTitle}
                referrerPolicy="no-referrer"
                className="w-28 h-16 object-cover rounded-lg shrink-0 bg-[#343025]"
              />
              <div className="min-w-0">
                <div className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                  {item.subject} · {item.durationMinutes} min · {item.level}
                </div>
                <div className="text-sm font-semibold text-[#29251d] dark:text-[#eee2ca] truncate mt-0.5">
                  {item.subtopicTitle}
                </div>
                <div className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
                  {item.instructor}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Adaptive Video Player + Timestamp Notes & Ask AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          {/* Player Canvas */}
          <div className="bg-[#1d1a15] rounded-xl overflow-hidden border border-[#c3a47b]/25">
            <div className="relative aspect-video bg-[#1d1a15]">
              <img
                src={lecture.thumbnail}
                alt={lecture.subtopicTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1d1a15]/90 via-[#1d1a15]/25 to-transparent" />

              {/* Captions Overlay */}
              {captionsOn && currentTranscript && (
                <div className="absolute bottom-14 inset-x-6 text-center">
                  <span className="inline-block bg-[#1d1a15]/85 text-[#eee2ca] border border-[#c3a47b]/25 text-xs sm:text-sm px-3.5 py-1.5 rounded-md max-w-xl">
                    {currentTranscript.line}
                  </span>
                </div>
              )}

              {/* Bottom Controls Bar */}
              <div className="absolute bottom-0 inset-x-0 p-3.5 bg-[#1d1a15]/95 border-t border-[#c3a47b]/20 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={totalSec}
                  value={currentSeconds}
                  onChange={(e) => setCurrentSeconds(Number(e.target.value))}
                  aria-label="Lecture playback timeline"
                  className="w-full accent-[#c3a47b] cursor-pointer h-1.5"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#eee2ca]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c3a47b] hover:bg-[#dbc39c] text-[#1d1a15] rounded-md font-semibold cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <span className="font-mono tabular-nums text-[#c5b79e]">
                      {formatTime(currentSeconds)} / {formatTime(totalSec)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCaptionsOn((c) => !c)}
                      className={`px-2 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                        captionsOn
                          ? 'border-[#c3a47b] text-[#c3a47b] bg-[#343025]'
                          : 'border-[#c3a47b]/25 text-[#c5b79e]'
                      }`}
                    >
                      CC
                    </button>
                    <select
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      aria-label="Playback speed"
                      className="bg-[#29251d] border border-[#c3a47b]/25 rounded px-2 py-1 text-[11px] font-mono text-[#eee2ca]"
                    >
                      {SPEEDS.map((s) => (
                        <option key={s} value={s}>
                          {s}x
                        </option>
                      ))}
                    </select>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      aria-label="Video resolution"
                      className="bg-[#29251d] border border-[#c3a47b]/25 rounded px-2 py-1 text-[11px] font-mono text-[#eee2ca]"
                    >
                      {QUALITIES.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instant ASK AI at Current Timestamp */}
          <div className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#29251d] dark:text-[#eee2ca]">
                <Sparkles className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b]" />
                Ask AI About Timestamp {formatTime(currentSeconds)}
              </div>
              <span className="text-xs text-[#5e5240] dark:text-[#c5b79e]">Uses live lecture transcript context</span>
            </div>
            <form onSubmit={handleAskAtTimestamp} className="flex gap-2">
              <input
                type="text"
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                placeholder={`Ask a doubt about what happens at ${formatTime(currentSeconds)}...`}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca] focus:outline-none focus:ring-2 focus:ring-[#c3a47b]"
              />
              <button
                type="submit"
                disabled={askLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {askLoading ? 'Thinking...' : 'Ask AI'}
              </button>
            </form>
            {askReply && (
              <div className="mt-3 p-3.5 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 text-xs leading-relaxed text-[#29251d] dark:text-[#eee2ca]">
                {askReply}
              </div>
            )}
          </div>

          {/* Smart AI Highlighting & Transcript */}
          <div className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#29251d] dark:text-[#eee2ca] mb-3">
              Smart AI Highlights &amp; Clickable Timestamps
            </h3>
            <div className="space-y-2.5">
              {lecture.highlights.map((h) => (
                <button
                  key={h.timeLabel}
                  type="button"
                  onClick={() => setCurrentSeconds(h.seconds)}
                  className="w-full text-left p-3 rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/20 hover:border-[#8b673c] dark:hover:border-[#c3a47b] transition-colors flex items-start gap-3 cursor-pointer"
                >
                  <span className="font-mono text-xs font-semibold text-[#8b673c] dark:text-[#c3a47b] tabular-nums shrink-0 mt-0.5">
                    {h.timeLabel}
                  </span>
                  <div className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                    <span className="font-semibold text-[#29251d] dark:text-[#eee2ca]">{h.tag}: </span>
                    {h.text}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Timestamp Notes, Proficiency Texts, Downloads, WHY Tree */}
        <div className="lg:col-span-5 space-y-5">
          {/* Timestamped Written & Voice Memo Notes */}
          <div className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-[#29251d] dark:text-[#eee2ca]">
                Timestamp Notes (@ {formatTime(currentSeconds)})
              </h3>
              <button
                type="button"
                onClick={handleVoiceMemoToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  recordingVoice
                    ? 'bg-[#a96346] text-[#fbf6ea] border-[#a96346]'
                    : 'border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025]'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                {recordingVoice ? 'Stop & Save Memo' : 'Record Voice Memo'}
              </button>
            </div>

            <form onSubmit={handleSaveWrittenNote} className="flex gap-2 mb-4">
              <input
                type="text"
                value={writtenDraft}
                onChange={(e) => setWrittenDraft(e.target.value)}
                placeholder={`Pin written note at ${formatTime(currentSeconds)}...`}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca] focus:outline-none focus:ring-2 focus:ring-[#c3a47b]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#29251d] dark:bg-[#c3a47b] dark:text-[#1d1a15] rounded-lg cursor-pointer"
              >
                Pin Note
              </button>
            </form>

            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {lectureNotes.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 text-xs"
                >
                  <div className="flex items-center justify-between text-[#5e5240] dark:text-[#c5b79e] mb-1">
                    <button
                      type="button"
                      onClick={() => setCurrentSeconds(n.timestampSeconds)}
                      className="font-mono font-semibold text-[#8b673c] dark:text-[#c3a47b] hover:underline tabular-nums cursor-pointer"
                    >
                      {n.timestampLabel}
                    </button>
                    <span className="flex items-center gap-1">
                      {n.type === 'voice' ? <Volume2 className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                      {n.type === 'voice' ? `Voice Memo (${n.durationLabel})` : 'Written Note'}
                    </span>
                  </div>
                  <p className="text-[#29251d] dark:text-[#eee2ca] leading-relaxed">{n.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Proficiency-Adaptive Reading Material + Downloads */}
          <div className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-[#29251d] dark:text-[#eee2ca]">
                Customized Explanation Level
              </h3>
              <div className="flex items-center gap-1 p-1 bg-[#f4ecd8] dark:bg-[#1d1a15] rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/20">
                {(['Beginner', 'Intermediate', 'Advanced'] as ExplanationLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                      level === lvl
                        ? 'bg-[#29251d] text-[#eee2ca] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                        : 'text-[#5e5240] dark:text-[#c5b79e]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[#29251d] dark:text-[#eee2ca] leading-relaxed">
              <p>{lecture.explanations[level].summary}</p>
              <div className="p-2.5 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 font-mono text-[#29251d] dark:text-[#eee2ca]">
                {lecture.explanations[level].keyFormula}
              </div>
              <p className="text-[#5e5240] dark:text-[#c5b79e]">
                <strong className="text-[#29251d] dark:text-[#eee2ca]">Derivation: </strong>
                {lecture.explanations[level].derivationNote}
              </p>
              <p className="text-[#5e5240] dark:text-[#c5b79e]">
                <strong className="text-[#29251d] dark:text-[#eee2ca]">Application: </strong>
                {lecture.explanations[level].realWorldApp}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e5d9bf] dark:border-[#c3a47b]/15 flex flex-wrap gap-2">
              {(['Lecture Notes', 'Formula Sheet', 'DPP Practice'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => handleDownloadMaterial(kind)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {kind}
                </button>
              ))}
            </div>
          </div>

          {/* First-Principles WHY Drill-Down */}
          <div className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b]" />
              <h3 className="text-sm font-semibold text-[#29251d] dark:text-[#eee2ca]">
                First-Principles WHY Drill-Down
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {lecture.formulasForWhy.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedWhyId(f.id)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg border cursor-pointer ${
                    selectedWhyId === f.id
                      ? 'bg-[#8b673c] text-[#fbf6ea] border-[#8b673c] dark:bg-[#c3a47b] dark:text-[#1d1a15] dark:border-[#c3a47b]'
                      : 'border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca]'
                  }`}
                >
                  {f.expression}
                </button>
              ))}
            </div>

            {selectedWhy && (
              <div className="space-y-2 text-xs text-[#5e5240] dark:text-[#c5b79e]">
                <div className="font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  {selectedWhy.name} · {selectedWhy.origin}
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  {selectedWhy.principles.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-[#e5d9bf] dark:border-[#c3a47b]/15">
                  <strong className="text-[#29251d] dark:text-[#eee2ca]">Assumptions: </strong>
                  {selectedWhy.assumptions.join(' ')}
                </div>
                <div>
                  <strong className="text-[#29251d] dark:text-[#eee2ca]">Limitations: </strong>
                  {selectedWhy.limitations.join(' ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
};
