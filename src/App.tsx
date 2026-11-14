import React, { useEffect, useState } from 'react';
import { BookOpen, Globe, Moon, RotateCcw, Search, Shield, Sun } from 'lucide-react';
import { BestsellersBookShowcase } from '@designcodeio/threeui';
import '@designcodeio/threeui/style.css';
import {
  INITIAL_DEPOSIT_LEDGER,
  INITIAL_GUARDIAN_NOTIFICATIONS,
  INITIAL_MENTOR_SUBMISSIONS,
  INITIAL_NOTES,
} from './data/curriculum';
import { TRACK_CONFIG } from './data/ecosystem';
import { TRACK_STUDY_MATERIALS } from './data/trackMaterials';
import { focusAudio, type FocusAudioMode } from './utils/focusAudio';
import { StudyHub } from './components/StudyHub';
import { LectureStudio } from './components/LectureStudio';
import { KnowledgeVault } from './components/KnowledgeVault';
import { RecallAndLab } from './components/RecallAndLab';
import { ArenaAndSquads } from './components/ArenaAndSquads';
import { DepositAndAccountability } from './components/DepositAndAccountability';
import type {
  DepositCourseLedger,
  ExamTrack,
  Flashcard,
  GuardianNotification,
  MentorSubmission,
  QuizQuestion,
  RevisionItem,
  ScheduleBlock,
  StudySessionState,
  SubtopicItem,
  TimestampNote,
  UserRole,
  WorkspaceSection,
} from './types/mindforge';

const DEFAULT_COMPLETED_SYLLABUS: Record<string, boolean> = {
  'jee-1': true,
  'jee-2': true,
  'jee-3': true,
  'neet-1': true,
  'neet-2': true,
  'neet-3': true,
  'upsc-1': true,
  'upsc-2': true,
  'upsc-3': true,
};

const DEFAULT_EDUCATOR_NOTES = [
  { id: 1, text: 'Always verify boundary conditions & units before locking final answer.' },
];

export function Scene() {
  return (
    <div className="shader-frame" style={{ width: '100%', height: '100vh' }}>
      <BestsellersBookShowcase
        headingFont="iowan-old-style"
        bodyFont="iowan-old-style"
        headingWeight="500"
        bodyWeight="400"
        primaryColor="#c3a47b"
        headingSize={325}
        bodySize={17}
        headingLetterSpacing={-0.085}
      />
    </div>
  );
}

export default function App() {
  const [enteredApp, setEnteredApp] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [role, setRole] = useState<UserRole>('student');
  const [section, setSection] = useState<WorkspaceSection>('hub');

  // Merged HACKATHON_EIC persistent ecosystem state
  const [track, setTrack] = useState<ExamTrack>(() => {
    try {
      const saved = localStorage.getItem('mindforge_eic_track');
      if (saved === 'jee' || saved === 'neet' || saved === 'upsc') return saved;
    } catch {
      // ignore storage errors
    }
    return 'jee';
  });
  const [xp, setXp] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem('mindforge_eic_xp'));
      return Number.isFinite(v) && v > 0 ? v : 1250;
    } catch {
      return 1250;
    }
  });
  const [elo, setElo] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem('mindforge_eic_elo'));
      return Number.isFinite(v) && v > 0 ? v : 1465;
    } catch {
      return 1465;
    }
  });
  const [completedSyllabus, setCompletedSyllabus] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('mindforge_eic_syllabus');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return DEFAULT_COMPLETED_SYLLABUS;
  });
  const [educatorNotes, setEducatorNotes] = useState<Array<{ id: number; text: string }>>(() => {
    try {
      const raw = localStorage.getItem('mindforge_eic_ednotes');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return DEFAULT_EDUCATOR_NOTES;
  });

  // Global Concept Search & Web Audio Focus Synth state
  const [globalSearchDraft, setGlobalSearchDraft] = useState('');
  const [vaultQuery, setVaultQuery] = useState<string | undefined>(undefined);
  const [audioMode, setAudioMode] = useState<FocusAudioMode>('off');
  const [audioVolume, setAudioVolume] = useState<number>(0.35);

  // Core Level 1 states — strictly separated per ExamTrack (JEE / NEET / UPSC)
  const [availableMinutes, setAvailableMinutes] = useState(45);
  const [scheduleByTrack, setScheduleByTrack] = useState<Record<ExamTrack, ScheduleBlock[]>>({
    jee: TRACK_STUDY_MATERIALS.jee.defaultSchedule,
    neet: TRACK_STUDY_MATERIALS.neet.defaultSchedule,
    upsc: TRACK_STUDY_MATERIALS.upsc.defaultSchedule,
  });
  const [subtopicsByTrack, setSubtopicsByTrack] = useState<Record<ExamTrack, SubtopicItem[]>>({
    jee: TRACK_STUDY_MATERIALS.jee.subtopics,
    neet: TRACK_STUDY_MATERIALS.neet.subtopics,
    upsc: TRACK_STUDY_MATERIALS.upsc.subtopics,
  });
  const [loadingSubtopicId, setLoadingSubtopicId] = useState<string | null>(null);
  const [activeLectureId, setActiveLectureId] = useState('lec-semi-1');
  const [notes, setNotes] = useState<TimestampNote[]>(INITIAL_NOTES);
  const [flashcardsByTrack, setFlashcardsByTrack] = useState<Record<ExamTrack, Flashcard[]>>({
    jee: TRACK_STUDY_MATERIALS.jee.flashcards,
    neet: TRACK_STUDY_MATERIALS.neet.flashcards,
    upsc: TRACK_STUDY_MATERIALS.upsc.flashcards,
  });
  const [quizByTrack, setQuizByTrack] = useState<Record<ExamTrack, QuizQuestion[]>>({
    jee: TRACK_STUDY_MATERIALS.jee.quiz,
    neet: TRACK_STUDY_MATERIALS.neet.quiz,
    upsc: TRACK_STUDY_MATERIALS.upsc.quiz,
  });
  const [revisionsByTrack, setRevisionsByTrack] = useState<Record<ExamTrack, RevisionItem[]>>({
    jee: TRACK_STUDY_MATERIALS.jee.revisions,
    neet: TRACK_STUDY_MATERIALS.neet.revisions,
    upsc: TRACK_STUDY_MATERIALS.upsc.revisions,
  });

  const schedule = scheduleByTrack[track];
  const subtopics = subtopicsByTrack[track];
  const flashcards = flashcardsByTrack[track];
  const quiz = quizByTrack[track];
  const revisions = revisionsByTrack[track];

  const setSchedule: React.Dispatch<React.SetStateAction<ScheduleBlock[]>> = (updater) => {
    setScheduleByTrack((prev) => ({
      ...prev,
      [track]: typeof updater === 'function' ? updater(prev[track]) : updater,
    }));
  };
  const [deposit, setDeposit] = useState<DepositCourseLedger>(INITIAL_DEPOSIT_LEDGER);
  const [guardianNotifications, setGuardianNotifications] = useState<GuardianNotification[]>(
    INITIAL_GUARDIAN_NOTIFICATIONS
  );
  const [mentorSubmissions, setMentorSubmissions] = useState<MentorSubmission[]>(
    INITIAL_MENTOR_SUBMISSIONS
  );
  const [streakDays] = useState(14);

  const [session, setSession] = useState<StudySessionState>({
    id: null,
    active: false,
    topicTitle: TRACK_STUDY_MATERIALS[track].focusTopics[0],
    plannedMinutes: 45,
    startedAtIso: null,
    expectedEndLabel: null,
    elapsedSeconds: 0,
    focusModeEnabled: false,
    tabInterruptions: 0,
  });

  // Persist ecosystem progress
  useEffect(() => {
    try {
      localStorage.setItem('mindforge_eic_track', track);
      localStorage.setItem('mindforge_eic_xp', String(xp));
      localStorage.setItem('mindforge_eic_elo', String(elo));
      localStorage.setItem('mindforge_eic_syllabus', JSON.stringify(completedSyllabus));
      localStorage.setItem('mindforge_eic_ednotes', JSON.stringify(educatorNotes));
    } catch {
      // ignore storage errors
    }
  }, [track, xp, elo, completedSyllabus, educatorNotes]);

  // Listen for "Enter MindForge" click inside BestsellersBookShowcase iframe
  useEffect(() => {
    const validSections: WorkspaceSection[] = [
      'hub',
      'lectures',
      'knowledge',
      'recall',
      'arena',
      'deposit',
    ];
    const validTracks: ExamTrack[] = ['jee', 'neet', 'upsc'];
    const applySection = (sec?: string, incomingTrack?: string) => {
      if (sec && validSections.includes(sec as WorkspaceSection)) {
        setSection(sec as WorkspaceSection);
      }
      if (incomingTrack && validTracks.includes(incomingTrack as ExamTrack)) {
        setTrack(incomingTrack as ExamTrack);
      }
      setEnteredApp(true);
    };
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'enter-mindforge') {
        applySection(event.data?.section, event.data?.track);
      }
    };
    const handleCustomEnter = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: string; track?: string }>).detail;
      applySection(detail?.section, detail?.track);
    };
    window.addEventListener('message', handleMessage);
    window.addEventListener('enter-mindforge', handleCustomEnter);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('enter-mindforge', handleCustomEnter);
    };
  }, []);

  // Sync Tailwind .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Live session timer tick
  useEffect(() => {
    if (!session.active) return;
    const id = window.setInterval(() => {
      setSession((prev) => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [session.active]);

  // Honest browser visibility interruption counter during active Focus Mode
  useEffect(() => {
    if (!session.focusModeEnabled) return;
    const handleVis = () => {
      if (document.hidden) {
        setSession((prev) => ({
          ...prev,
          tabInterruptions: prev.tabInterruptions + 1,
        }));
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, [session.focusModeEnabled]);

  const handleStartSession = async (minutes: number, topicTitle: string) => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plannedMinutes: minutes, topicTitle }),
      });
      const data = await res.json();
      if (data.event) {
        setGuardianNotifications((prev) => [data.event, ...prev]);
      }
      setSession((prev) => ({
        ...prev,
        id: `sess-${Date.now()}`,
        active: true,
        topicTitle,
        plannedMinutes: minutes,
        startedAtIso: new Date().toISOString(),
        expectedEndLabel: data.expectedEndLabel || 'Scheduled',
        elapsedSeconds: 0,
      }));
    } catch {
      setSession((prev) => ({
        ...prev,
        id: `sess-${Date.now()}`,
        active: true,
        topicTitle,
        plannedMinutes: minutes,
        startedAtIso: new Date().toISOString(),
        expectedEndLabel: 'In Progress',
        elapsedSeconds: 0,
      }));
    }
  };

  const handleEndSession = async (voluntaryEarlyExit: boolean) => {
    const actualMinutes = Math.max(1, Math.round(session.elapsedSeconds / 60));
    try {
      const res = await fetch('/api/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plannedMinutes: session.plannedMinutes,
          actualMinutes,
          voluntaryEarlyExit,
          topicTitle: session.topicTitle,
        }),
      });
      const data = await res.json();
      if (data.event) {
        setGuardianNotifications((prev) => [data.event, ...prev]);
      }
    } finally {
      setSession((prev) => ({
        ...prev,
        active: false,
        focusModeEnabled: false,
      }));
    }
  };

  const handleToggleSubtopic = async (subtopicId: string) => {
    const activeTrack = track;
    const target = subtopicsByTrack[activeTrack].find((s) => s.id === subtopicId);
    if (!target) return;

    const nextCompleted = !target.completed;
    setSubtopicsByTrack((prev) => ({
      ...prev,
      [activeTrack]: prev[activeTrack].map((s) =>
        s.id === subtopicId ? { ...s, completed: nextCompleted } : s
      ),
    }));

    if (nextCompleted) {
      setLoadingSubtopicId(subtopicId);
      const trackTopic = TRACK_STUDY_MATERIALS[activeTrack].focusTopics[0];
      try {
        const res = await fetch('/api/ai/subtopic-pack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicTitle: trackTopic,
            subtopicTitle: target.title,
            level: 'Intermediate',
          }),
        });
        const data = await res.json();
        if (Array.isArray(data.flashcards)) {
          setFlashcardsByTrack((prev) => ({
            ...prev,
            [activeTrack]: [...data.flashcards, ...prev[activeTrack]],
          }));
        }
        if (Array.isArray(data.quiz)) {
          setQuizByTrack((prev) => ({
            ...prev,
            [activeTrack]: data.quiz,
          }));
        }
        // Automatically enqueue 1-day spaced repetition entry for this track
        setRevisionsByTrack((prev) => {
          const list = prev[activeTrack];
          if (list.some((r) => r.subtopicTitle === target.title)) return prev;
          return {
            ...prev,
            [activeTrack]: [
              {
                id: `rev-${Date.now()}`,
                topicTitle: trackTopic,
                subtopicTitle: target.title,
                intervalStage: '1-Day',
                status: 'upcoming',
                dueLabel: 'Tomorrow (1-Day Interval)',
                accuracyRate: target.masteryScore || 50,
                promptQuestion: `Recall the core mechanism and primary key rule for ${target.title}.`,
                modelAnswer: `Summarize first-principles concept, boundary conditions, and exam traps for ${target.title}.`,
              },
              ...list,
            ],
          };
        });
      } finally {
        setLoadingSubtopicId(null);
      }
    }
  };

  const handleUpdateRevision = (id: string, recalledWell: boolean) => {
    setRevisionsByTrack((prev) => ({
      ...prev,
      [track]: prev[track].map((r) => {
        if (r.id !== id) return r;
        if (recalledWell) {
          const nextStage =
            r.intervalStage === '1-Day'
              ? '3-Day'
              : r.intervalStage === '3-Day'
              ? '7-Day'
              : '14-Day';
          return {
            ...r,
            status: 'completed',
            intervalStage: nextStage,
            dueLabel: `Scheduled in ${nextStage}`,
            accuracyRate: Math.min(100, r.accuracyRate + 10),
          };
        }
        return {
          ...r,
          status: 'today',
          intervalStage: '1-Day',
          dueLabel: 'Reinforcement Due Tomorrow',
          accuracyRate: Math.max(30, r.accuracyRate - 10),
        };
      }),
    }));
  };

  const handleQuizCompleted = (scorePercent: number) => {
    setSubtopicsByTrack((prev) => ({
      ...prev,
      [track]: prev[track].map((s) =>
        s.completed && s.masteryScore < scorePercent
          ? { ...s, masteryScore: scorePercent, lastPracticed: 'Just now' }
          : s
      ),
    }));
  };

  const handleEvaluateSubmission = (id: string, marks: number, remarks: string) => {
    setMentorSubmissions((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, mentorMarks: marks, mentorRemarks: remarks, status: 'evaluated' } : m
      )
    );
  };

  const handleToggleTrackSyllabus = (id: string) => {
    setCompletedSyllabus((prev) => {
      const nextVal = !prev[id];
      if (nextVal) {
        setXp((x) => x + 50);
      }
      return { ...prev, [id]: nextVal };
    });
  };

  const handleToggleAudio = (mode: 'brown' | 'alpha') => {
    const next = focusAudio.start(mode);
    setAudioMode(next);
  };

  const handleStopAudio = () => {
    setAudioMode(focusAudio.stop());
  };

  const handleChangeAudioVolume = (val: number) => {
    setAudioVolume(val);
    focusAudio.setVolume(val);
  };

  const handleResetProgress = () => {
    setTrack('jee');
    setXp(1250);
    setElo(1465);
    setCompletedSyllabus(DEFAULT_COMPLETED_SYLLABUS);
    setEducatorNotes(DEFAULT_EDUCATOR_NOTES);
    setScheduleByTrack({
      jee: TRACK_STUDY_MATERIALS.jee.defaultSchedule,
      neet: TRACK_STUDY_MATERIALS.neet.defaultSchedule,
      upsc: TRACK_STUDY_MATERIALS.upsc.defaultSchedule,
    });
    setSubtopicsByTrack({
      jee: TRACK_STUDY_MATERIALS.jee.subtopics,
      neet: TRACK_STUDY_MATERIALS.neet.subtopics,
      upsc: TRACK_STUDY_MATERIALS.upsc.subtopics,
    });
    setFlashcardsByTrack({
      jee: TRACK_STUDY_MATERIALS.jee.flashcards,
      neet: TRACK_STUDY_MATERIALS.neet.flashcards,
      upsc: TRACK_STUDY_MATERIALS.upsc.flashcards,
    });
    setQuizByTrack({
      jee: TRACK_STUDY_MATERIALS.jee.quiz,
      neet: TRACK_STUDY_MATERIALS.neet.quiz,
      upsc: TRACK_STUDY_MATERIALS.upsc.quiz,
    });
    setRevisionsByTrack({
      jee: TRACK_STUDY_MATERIALS.jee.revisions,
      neet: TRACK_STUDY_MATERIALS.neet.revisions,
      upsc: TRACK_STUDY_MATERIALS.upsc.revisions,
    });
    try {
      localStorage.removeItem('mindforge_eic_track');
      localStorage.removeItem('mindforge_eic_xp');
      localStorage.removeItem('mindforge_eic_elo');
      localStorage.removeItem('mindforge_eic_syllabus');
      localStorage.removeItem('mindforge_eic_ednotes');
    } catch {
      // ignore
    }
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearchDraft.trim();
    if (!q) return;
    setVaultQuery(q);
    setSection('knowledge');
  };

  const handleRoleSwitch = (nextRole: UserRole) => {
    setRole(nextRole);
    if (nextRole === 'parent' || nextRole === 'mentor') {
      setSection('deposit');
    }
  };

  if (!enteredApp) {
    return (
      <div className="relative w-full min-h-screen bg-[#29251d] overflow-hidden">
        <Scene />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4ecd8] text-[#29251d] dark:bg-[#29251d] dark:text-[#eee2ca] transition-colors">
      {/* Top Bar Contract: [Brand title] — [concise single-line nav links] — [1 primary action] */}
      <header className="sticky top-0 z-30 bg-[#fbf6ea]/95 dark:bg-[#211e18]/95 backdrop-blur border-b border-[#dccfb4] dark:border-[#c3a47b]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => setSection('hub')}
            className="text-2xl italic font-semibold tracking-tight text-[#8b673c] dark:text-[#c3a47b] whitespace-nowrap shrink-0 cursor-pointer font-display"
          >
            MindForge
          </button>

          {/* Zone 2: Concise single-line text nav links */}
          {!session.focusModeEnabled ? (
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#5e5240] dark:text-[#c5b79e]">
              {(
                [
                  ['hub', 'Study Hub'],
                  ['lectures', 'Lectures & Board'],
                  ['knowledge', 'Knowledge Vault'],
                  ['recall', 'Recall & Lab'],
                  ['arena', 'Arena & Squads'],
                  ['deposit', 'Deposit & Family'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                    section === id
                      ? 'text-[#29251d] dark:text-[#eee2ca] border-[#8b673c] dark:border-[#c3a47b]'
                      : 'border-transparent hover:text-[#29251d] dark:hover:text-[#eee2ca]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          ) : (
            <div className="text-xs font-medium text-[#8b673c] dark:text-[#c3a47b] whitespace-nowrap">
              Focus Mode Active · Navigation Hidden ({session.tabInterruptions} tab switches logged)
            </div>
          )}

          {/* Zone 3: 1 primary action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() =>
                setSession((prev) => ({
                  ...prev,
                  focusModeEnabled: !prev.focusModeEnabled,
                }))
              }
              className="px-4 py-2 text-xs font-semibold rounded-lg text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {session.focusModeEnabled ? 'Exit Focus Mode' : 'Focus Mode'}
            </button>
          </div>
        </div>

        {/* Mobile navigation row when not in focus mode */}
        {!session.focusModeEnabled && (
          <div className="md:hidden border-t border-[#e5d9bf] dark:border-[#c3a47b]/15 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium">
            {(
              [
                ['hub', 'Study Hub'],
                ['lectures', 'Lectures & Board'],
                ['knowledge', 'Knowledge Vault'],
                ['recall', 'Recall & Lab'],
                ['arena', 'Arena & Squads'],
                ['deposit', 'Deposit & Family'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`whitespace-nowrap shrink-0 py-1 ${
                  section === id
                    ? 'text-[#8b673c] dark:text-[#c3a47b] font-semibold'
                    : 'text-[#5e5240] dark:text-[#c5b79e]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Workspace Sub-Toolbar: Track Switcher + Global Knowledge Search + Role + Field Library + Theme */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Exam Track Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-lg text-xs font-semibold">
              {(['jee', 'neet', 'upsc'] as ExamTrack[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrack(t)}
                  className={`px-2.5 py-1 rounded-md uppercase transition-colors cursor-pointer ${
                    track === t
                      ? 'bg-[#8b673c] text-[#fbf6ea] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                      : 'text-[#5e5240] dark:text-[#c5b79e] hover:text-[#29251d] dark:hover:text-[#eee2ca]'
                  }`}
                >
                  {TRACK_CONFIG[t].shortLabel}
                </button>
              ))}
            </div>

            {/* Role Switcher */}
            <div className="flex items-center gap-2 text-xs text-[#5e5240] dark:text-[#c5b79e]">
              <Shield className="w-3.5 h-3.5 text-[#8b673c] dark:text-[#c3a47b]" />
              <div className="flex items-center gap-1 p-1 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-lg">
                {(['student', 'parent', 'mentor'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleSwitch(r)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                      role === r
                        ? 'bg-[#29251d] text-[#eee2ca] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                        : 'text-[#5e5240] dark:text-[#c5b79e] hover:text-[#29251d] dark:hover:text-[#eee2ca]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Telemetry Strip */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/20 bg-[#fbf6ea] dark:bg-[#211e18] text-[11px] font-mono text-[#5e5240] dark:text-[#c5b79e]">
              <span>
                XP <strong className="text-[#29251d] dark:text-[#eee2ca]">{xp}</strong>
              </span>
              <span>
                ELO <strong className="text-[#8b673c] dark:text-[#c3a47b]">{elo}</strong>
              </span>
              <span>
                Streak <strong className="text-[#5f684f] dark:text-[#89946f]">{streakDays}d</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Global Universal Knowledge Search (Wikipedia + OpenAlex) */}
            <form onSubmit={handleGlobalSearchSubmit} className="flex items-center rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] px-2.5 py-1">
              <Globe className="w-3.5 h-3.5 text-[#8b673c] dark:text-[#c3a47b] mr-1.5 shrink-0" />
              <input
                type="text"
                value={globalSearchDraft}
                onChange={(e) => setGlobalSearchDraft(e.target.value)}
                placeholder="Search Wikipedia, OpenAlex..."
                className="w-40 sm:w-48 bg-transparent text-xs text-[#29251d] dark:text-[#eee2ca] placeholder:text-[#7c6e58] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Search Knowledge Vault"
                className="ml-1 text-[#8b673c] dark:text-[#c3a47b] hover:opacity-80 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            <button
              type="button"
              onClick={() => setEnteredApp(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#8b673c] dark:text-[#c3a47b]" />
              Field Library
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-[#c3a47b]" /> : <Moon className="w-3.5 h-3.5 text-[#8b673c]" />}
              {darkMode ? 'Paper Light' : 'Espresso Dark'}
            </button>
            <button
              type="button"
              onClick={handleResetProgress}
              title="Reset local progress"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] text-[#5e5240] dark:text-[#c5b79e] hover:text-[#a96346] dark:hover:text-[#d98c6e] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {section === 'hub' && (
          <StudyHub
            track={track}
            completedSyllabus={completedSyllabus}
            onToggleTrackSyllabus={handleToggleTrackSyllabus}
            audioMode={audioMode}
            audioVolume={audioVolume}
            onToggleAudio={handleToggleAudio}
            onStopAudio={handleStopAudio}
            onChangeAudioVolume={handleChangeAudioVolume}
            schedule={schedule}
            setSchedule={setSchedule}
            availableMinutes={availableMinutes}
            setAvailableMinutes={setAvailableMinutes}
            session={session}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            subtopics={subtopics}
            onToggleSubtopic={handleToggleSubtopic}
            loadingSubtopicId={loadingSubtopicId}
            onOpenLecture={(lecId) => {
              if (lecId) setActiveLectureId(lecId);
              setSection('lectures');
            }}
            onAddGeneratedPack={(newCards, newQuiz) => {
              if (newCards.length) {
                setFlashcardsByTrack((prev) => ({
                  ...prev,
                  [track]: [...newCards, ...prev[track]],
                }));
              }
              if (newQuiz.length) {
                setQuizByTrack((prev) => ({
                  ...prev,
                  [track]: newQuiz,
                }));
              }
            }}
            streakDays={streakDays}
            onNavigateSection={(sec) => setSection(sec)}
          />
        )}

        {section === 'lectures' && (
          <LectureStudio
            track={track}
            activeLectureId={activeLectureId}
            setActiveLectureId={setActiveLectureId}
            notes={notes}
            onAddNote={(n) => setNotes((prev) => [n, ...prev])}
            educatorNotes={educatorNotes}
            onAddEducatorNote={(text) =>
              setEducatorNotes((prev) => [{ id: Date.now(), text }, ...prev])
            }
            onDeleteEducatorNote={(id) =>
              setEducatorNotes((prev) => prev.filter((item) => item.id !== id))
            }
            onOpenKnowledgeVault={() => setSection('knowledge')}
          />
        )}

        {section === 'knowledge' && (
          <KnowledgeVault
            track={track}
            initialQuery={vaultQuery}
            onAddFlashcards={(newCards) => {
              setFlashcardsByTrack((prev) => ({
                ...prev,
                [track]: [...newCards, ...prev[track]],
              }));
              setXp((x) => x + 30);
            }}
            onJumpToRecall={() => setSection('recall')}
          />
        )}

        {section === 'recall' && (
          <RecallAndLab
            track={track}
            elo={elo}
            onUpdateEloAndXp={(dElo, dXp) => {
              setElo((e) => Math.max(800, e + dElo));
              if (dXp) setXp((x) => x + dXp);
            }}
            flashcards={flashcards}
            quiz={quiz}
            revisions={revisions}
            onUpdateRevision={handleUpdateRevision}
            onQuizCompleted={handleQuizCompleted}
          />
        )}

        {section === 'arena' && (
          <ArenaAndSquads
            onOpenLecture={(lecId) => {
              setActiveLectureId(lecId);
              setSection('lectures');
            }}
          />
        )}

        {section === 'deposit' && (
          <DepositAndAccountability
            role={role}
            deposit={deposit}
            setDeposit={setDeposit}
            guardianNotifications={guardianNotifications}
            mentorSubmissions={mentorSubmissions}
            onEvaluateSubmission={handleEvaluateSubmission}
            tabInterruptions={session.tabInterruptions}
          />
        )}
      </main>

      {/* Quiet Editorial Footer with Persistent Focus Audio Controls */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 mt-8 border-t border-[#dccfb4] dark:border-[#c3a47b]/20 text-xs text-[#5e5240] dark:text-[#c5b79e] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="font-semibold text-[#29251d] dark:text-[#eee2ca]">
            MindForge Learning &amp; Accountability Ecosystem · {TRACK_CONFIG[track].badge}
          </div>
          <div>
            Wikipedia REST + OpenAlex + Real Educators + Web Audio DSP · 70% Escrow Demo
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleAudio('brown')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              audioMode === 'brown'
                ? 'bg-[#8b673c] text-[#fbf6ea] border-[#8b673c] dark:bg-[#c3a47b] dark:text-[#1d1a15] dark:border-[#c3a47b]'
                : 'border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] text-[#29251d] dark:text-[#eee2ca]'
            }`}
          >
            Brown Noise
          </button>
          <button
            type="button"
            onClick={() => handleToggleAudio('alpha')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              audioMode === 'alpha'
                ? 'bg-[#8b673c] text-[#fbf6ea] border-[#8b673c] dark:bg-[#c3a47b] dark:text-[#1d1a15] dark:border-[#c3a47b]'
                : 'border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] text-[#29251d] dark:text-[#eee2ca]'
            }`}
          >
            40Hz Alpha
          </button>
          {audioMode !== 'off' && (
            <button
              type="button"
              onClick={handleStopAudio}
              className="px-3 py-1.5 rounded-lg bg-[#a96346]/15 dark:bg-[#d98c6e]/20 text-[#a96346] dark:text-[#d98c6e] text-xs font-semibold cursor-pointer"
            >
              Mute
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
