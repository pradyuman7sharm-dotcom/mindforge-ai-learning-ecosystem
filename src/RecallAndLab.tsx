import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Eye,
  FileUp,
  RotateCw,
  Send,
  Sliders,
} from 'lucide-react';
import { TRACK_STUDY_MATERIALS } from '../data/trackMaterials';
import { ExamSimAndPyq } from './ExamSimAndPyq';
import type {
  BlurtingEvaluation,
  ExamTrack,
  Flashcard,
  QuizQuestion,
  RevisionItem,
} from '../types/mindforge';

interface RecallAndLabProps {
  track: ExamTrack;
  elo: number;
  onUpdateEloAndXp: (deltaElo: number, deltaXp: number) => void;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  revisions: RevisionItem[];
  onUpdateRevision: (id: string, recalledWell: boolean) => void;
  onQuizCompleted: (scorePercent: number) => void;
}

type RecallTab = 'recall' | 'pyq-sim' | 'spaced' | 'blurting' | 'tutor' | 'sandbox';

export const RecallAndLab: React.FC<RecallAndLabProps> = ({
  track,
  elo,
  onUpdateEloAndXp,
  flashcards,
  quiz,
  revisions,
  onUpdateRevision,
  onQuizCompleted,
}) => {
  const trackMat = TRACK_STUDY_MATERIALS[track];
  const [activeTab, setActiveTab] = useState<RecallTab>('recall');

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // 5-Minute Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Spaced Repetition retrieval reveal state
  const [revealedRevIds, setRevealedRevIds] = useState<Record<string, boolean>>({});
  const [recallDrafts, setRecallDrafts] = useState<Record<string, string>>({});

  // Weekend Blurting Method state (Zero hints initially!)
  const [blurtingTopic, setBlurtingTopic] = useState(trackMat.blurtingTopics[0]);
  const [blurtingText, setBlurtingText] = useState('');
  const [blurtingLoading, setBlurtingLoading] = useState(false);
  const [blurtingResult, setBlurtingResult] = useState<BlurtingEvaluation | null>(null);
  const [blurtingError, setBlurtingError] = useState<string | null>(null);

  // Socratic AI Tutor & Handwritten Grader state
  const [tutorMode, setTutorMode] = useState<'socratic' | 'direct'>('socratic');
  const [tutorInput, setTutorInput] = useState('');
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    {
      role: 'ai',
      text: trackMat.tutorGreeting,
    },
  ]);
  const [tutorLoading, setTutorLoading] = useState(false);

  const [graderQuestion, setGraderQuestion] = useState(trackMat.defaultGraderQuestion);
  const [graderAnswer, setGraderAnswer] = useState('');
  const [graderImage, setGraderImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [graderLoading, setGraderLoading] = useState(false);
  const [graderResult, setGraderResult] = useState<{
    score: number;
    accuracy: string;
    missingSteps: string[];
    mentorFeedback: string;
  } | null>(null);

  // Level 3 Interactive What-If Sandbox state
  const [projSpeed, setProjSpeed] = useState(28);
  const [projAngle, setProjAngle] = useState(45);
  const [projGravity, setProjGravity] = useState(9.8);
  const [chemConc, setChemConc] = useState(0.1);
  const [chemTemp, setChemTemp] = useState(298);

  // 3D Crystal Lattice Canvas controls
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotY, setRotY] = useState(0.5);
  const [rotX, setRotX] = useState(0.35);
  const [dopingMode, setDopingMode] = useState<'intrinsic' | 'n-type' | 'p-type'>('n-type');
  const [zoomScale, setZoomScale] = useState(1);

  // Trap Simulator state
  const [trapIdx, setTrapIdx] = useState(0);
  const [selectedTrapStep, setSelectedTrapStep] = useState<number | null>(null);

  useEffect(() => {
    const nextMat = TRACK_STUDY_MATERIALS[track];
    setCardIndex(0);
    setFlipped(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setBlurtingTopic(nextMat.blurtingTopics[0]);
    setBlurtingResult(null);
    setTutorMessages([{ role: 'ai', text: nextMat.tutorGreeting }]);
    setGraderQuestion(nextMat.defaultGraderQuestion);
    setGraderResult(null);
    setTrapIdx(0);
    setSelectedTrapStep(null);
  }, [track]);

  // Draw Interactive 3D Crystal Lattice
  useEffect(() => {
    if (activeTab !== 'sandbox') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Build 3x3x3 Silicon lattice nodes
    const nodes: Array<{ x: number; y: number; z: number; kind: 'si' | 'donor' | 'acceptor' }> = [];
    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        for (let iz = -1; iz <= 1; iz++) {
          let kind: 'si' | 'donor' | 'acceptor' = 'si';
          if (ix === 0 && iy === 0 && iz === 0) {
            if (dopingMode === 'n-type') kind = 'donor';
            if (dopingMode === 'p-type') kind = 'acceptor';
          }
          nodes.push({ x: ix * 55, y: iy * 55, z: iz * 55, kind });
        }
      }
    }

    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    const projected = nodes.map((n) => {
      const x1 = n.x * cosY - n.z * sinY;
      const z1 = n.x * sinY + n.z * cosY;
      const y2 = n.y * cosX - z1 * sinX;
      const z2 = n.y * sinX + z1 * cosX;
      const perspective = (320 * zoomScale) / (320 + z2);
      return {
        sx: w / 2 + x1 * perspective,
        sy: h / 2 + y2 * perspective,
        z: z2,
        r: Math.max(4, 9 * perspective),
        kind: n.kind,
      };
    });

    // Draw covalent lattice bonds
    ctx.strokeStyle = 'rgba(195, 164, 123, 0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist =
          Math.abs(nodes[i].x - nodes[j].x) +
          Math.abs(nodes[i].y - nodes[j].y) +
          Math.abs(nodes[i].z - nodes[j].z);
        if (dist === 55) {
          ctx.beginPath();
          ctx.moveTo(projected[i].sx, projected[i].sy);
          ctx.lineTo(projected[j].sx, projected[j].sy);
          ctx.stroke();
        }
      }
    }

    // Painter's algorithm sort
    const sorted = [...projected].sort((a, b) => b.z - a.z);
    for (const p of sorted) {
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, p.r, 0, Math.PI * 2);
      if (p.kind === 'donor') {
        ctx.fillStyle = '#c3a47b';
      } else if (p.kind === 'acceptor') {
        ctx.fillStyle = '#a96346';
      } else {
        ctx.fillStyle = '#6c6452';
      }
      ctx.fill();
      ctx.strokeStyle = '#eee2ca';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [activeTab, rotX, rotY, dopingMode, zoomScale]);

  const currentCard = flashcards[cardIndex % Math.max(1, flashcards.length)];

  const handleSubmitQuiz = () => {
    const correct = quiz.filter((q) => quizAnswers[q.id] === q.correctIndex).length;
    const score = Math.round((correct / Math.max(1, quiz.length)) * 100);
    setQuizSubmitted(true);
    onQuizCompleted(score);
  };

  const handleBlurtingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlurtingError(null);
    setBlurtingLoading(true);
    try {
      const res = await fetch('/api/ai/blurting-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicHeading: blurtingTopic,
          studentText: blurtingText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBlurtingError(data.error || 'Could not evaluate blurting response.');
        return;
      }
      setBlurtingResult(data.evaluation);
    } catch {
      setBlurtingError('Network error evaluating Sunday Blurting submission.');
    } finally {
      setBlurtingLoading(false);
    }
  };

  const handleTutorSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorInput.trim()) return;
    const q = tutorInput.trim();
    setTutorMessages((prev) => [...prev, { role: 'user', text: q }]);
    setTutorInput('');
    setTutorLoading(true);
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: tutorMode,
          message: q,
          context: 'JEE / Class 12 STEM Curriculum',
        }),
      });
      const data = await res.json();
      setTutorMessages((prev) => [
        ...prev,
        { role: 'ai', text: data.reply || data.error || 'No response received.' },
      ]);
    } catch {
      setTutorMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Connection error reaching AI Tutor.' },
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setGraderImage({ base64: reader.result, mimeType: file.type || 'image/png', name: file.name });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGradeAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setGraderLoading(true);
    try {
      const res = await fetch('/api/ai/grade-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: graderQuestion,
          studentAnswer: graderAnswer,
          imageBase64: graderImage?.base64,
          mimeType: graderImage?.mimeType,
        }),
      });
      const data = await res.json();
      if (data.result) setGraderResult(data.result);
    } finally {
      setGraderLoading(false);
    }
  };

  // Projectile math for SVG sandbox
  const rad = (projAngle * Math.PI) / 180;
  const maxRange = (projSpeed * projSpeed * Math.sin(2 * rad)) / projGravity;
  const maxHeight = (projSpeed * projSpeed * Math.sin(rad) * Math.sin(rad)) / (2 * projGravity);
  const flightTime = (2 * projSpeed * Math.sin(rad)) / projGravity;
  const svgWidth = 420;
  const svgHeight = 190;
  const scaleX = svgWidth / 120;
  const scaleY = svgHeight / 60;
  const pathPoints = Array.from({ length: 25 }, (_, i) => {
    const t = (flightTime * i) / 24;
    const x = projSpeed * Math.cos(rad) * t;
    const y = Math.max(0, projSpeed * Math.sin(rad) * t - 0.5 * projGravity * t * t);
    return `${i === 0 ? 'M' : 'L'} ${(20 + x * scaleX).toFixed(1)} ${(svgHeight - 16 - y * scaleY).toFixed(1)}`;
  }).join(' ');

  // Weak-acid pH calculation: pH = 0.5*(pKa - log10(C)) adjusted slightly by temperature
  const pKa = 4.76 - (chemTemp - 298) * 0.002;
  const computedPh = Math.max(0.5, Math.min(7, 0.5 * (pKa - Math.log10(Math.max(0.001, chemConc)))));

  const trackTraps = trackMat.trapPuzzles;
  const trap = trackTraps[trapIdx % trackTraps.length];

  return (
    <div className="space-y-6">
      {/* Section Header + Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#dccfb4] dark:border-[#c3a47b]/20">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[#8b673c]/15 dark:bg-[#c3a47b]/15 text-[#8b673c] dark:text-[#c3a47b] text-[11px] font-semibold">
              {trackMat.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#29251d] dark:text-[#eee2ca]">
            Active Recall, Spaced Repetition &amp; Concept Lab
          </h1>
          <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
            Track-dedicated retrieval flashcards, quizzes, 1d/3d/7d spacing, Sunday Blurting, Socratic AI, and interactive labs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-lg">
          {(
            [
              ['recall', 'Flashcards & Quiz'],
              ['pyq-sim', 'PYQ ELO & Rank Lab'],
              ['spaced', 'Spaced Repetition'],
              ['blurting', 'Sunday Blurting'],
              ['tutor', 'AI Tutor & Grader'],
              ['sandbox', 'What-If & 3D Lab'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === id
                  ? 'bg-[#29251d] text-[#eee2ca] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                  : 'text-[#5e5240] dark:text-[#c5b79e] hover:text-[#29251d] dark:hover:text-[#eee2ca]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Flashcards & 5-Min Quiz */}
      {activeTab === 'recall' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Active Recall Flashcard */}
          <div className="lg:col-span-5 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
            <div className="flex items-center justify-between text-xs text-[#5e5240] dark:text-[#c5b79e] mb-4">
              <span>{currentCard?.subtopicTitle}</span>
              <span className="font-mono tabular-nums">
                {(cardIndex % flashcards.length) + 1} / {flashcards.length}
              </span>
            </div>

            {currentCard && (
              <div className="min-h-48 p-5 rounded-xl bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-medium text-[#8b673c] dark:text-[#c3a47b] mb-2">
                    {currentCard.category} · {flipped ? 'Answer' : 'Prompt'}
                  </div>
                  <p className="text-sm sm:text-base font-medium text-[#29251d] dark:text-[#eee2ca] leading-relaxed">
                    {flipped ? currentCard.back : currentCard.front}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    {flipped ? 'Show Prompt' : 'Reveal Answer'}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFlipped(false);
                        setCardIndex((i) => i + 1);
                      }}
                      className="px-3 py-2 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer"
                    >
                      Needs Review
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFlipped(false);
                        setCardIndex((i) => i + 1);
                      }}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-[#5f684f] hover:bg-[#4e5640] text-[#fbf6ea] dark:bg-[#89946f] dark:hover:bg-[#9aa67e] dark:text-[#1d1a15] cursor-pointer"
                    >
                      Got It
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5-Minute Concept Quiz */}
          <div className="lg:col-span-7 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              <div>
                <h2 className="text-lg font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  Five-Minute Concept Check Quiz
                </h2>
                <p className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                  Score updates subtopic Mastery % independently of checklist status.
                </p>
              </div>
              {quizSubmitted && (
                <button
                  type="button"
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] cursor-pointer"
                >
                  Retake Quiz
                </button>
              )}
            </div>

            <div className="space-y-5 mt-4">
              {quiz.slice(0, 4).map((q, idx) => {
                const chosen = quizAnswers[q.id];
                return (
                  <div key={q.id} className="space-y-2">
                    <div className="text-sm font-medium text-[#29251d] dark:text-[#eee2ca]">
                      {idx + 1}. {q.question}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const selected = chosen === optIdx;
                        const isCorrect = quizSubmitted && optIdx === q.correctIndex;
                        const isWrong = quizSubmitted && selected && optIdx !== q.correctIndex;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                            className={`text-left px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${
                              isCorrect
                                ? 'border-[#5f684f] dark:border-[#89946f] bg-[#5f684f]/15 dark:bg-[#89946f]/20 text-[#29251d] dark:text-[#eee2ca]'
                                : isWrong
                                ? 'border-[#a96346] dark:border-[#d98c6e] bg-[#a96346]/15 dark:bg-[#a96346]/25 text-[#945a3e] dark:text-[#f2c4b3]'
                                : selected
                                ? 'border-[#8b673c] dark:border-[#c3a47b] bg-[#eadfc7] dark:bg-[#343025] text-[#29251d] dark:text-[#eee2ca]'
                                : 'border-[#dccfb4] dark:border-[#c3a47b]/20 text-[#5e5240] dark:text-[#c5b79e] hover:border-[#8b673c] dark:hover:border-[#c3a47b]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && (
                      <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] pt-1">
                        Explanation: {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}

              {!quizSubmitted && (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg cursor-pointer"
                >
                  Submit &amp; Update Mastery
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Spaced Repetition System (1d / 3d / 7d) */}
      {activeTab === 'spaced' && (
        <div className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
            <div>
              <h2 className="text-lg font-semibold text-[#29251d] dark:text-[#eee2ca]">
                Spaced Repetition Queue (1-Day · 3-Day · 7-Day)
              </h2>
              <p className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                Active retrieval before revealing answers. Strong recall extends your interval; weak recall schedules immediate reinforcement.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-[#5e5240] dark:text-[#c5b79e]">
              <span>Today: {revisions.filter((r) => r.status === 'today').length}</span>
              <span>Missed: {revisions.filter((r) => r.status === 'missed').length}</span>
              <span>Completed: {revisions.filter((r) => r.status === 'completed').length}</span>
            </div>
          </div>

          <div className="divide-y divide-[#e5d9bf] dark:divide-[#c3a47b]/15 mt-2">
            {revisions.map((rev) => {
              const revealed = Boolean(revealedRevIds[rev.id]);
              return (
                <div key={rev.id} className="py-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[#29251d] dark:text-[#eee2ca]">
                        {rev.topicTitle} · {rev.subtopicTitle}
                      </div>
                      <div className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
                        Interval: {rev.intervalStage} · {rev.dueLabel} · Prior Accuracy: {rev.accuracyRate}%
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        rev.status === 'missed'
                          ? 'text-[#945a3e] dark:text-[#d98c6e]'
                          : rev.status === 'completed'
                          ? 'text-[#5f684f] dark:text-[#89946f]'
                          : 'text-[#8b673c] dark:text-[#c3a47b]'
                      }`}
                    >
                      {rev.status === 'missed'
                        ? 'Needs Catch-Up'
                        : rev.status === 'completed'
                        ? 'Interval Extended'
                        : rev.status === 'today'
                        ? 'Due Today'
                        : 'Upcoming'}
                    </span>
                  </div>

                  <p className="text-xs text-[#29251d] dark:text-[#eee2ca]">
                    Recall Prompt: {rev.promptQuestion}
                  </p>

                  {!revealed ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={recallDrafts[rev.id] || ''}
                        onChange={(e) =>
                          setRecallDrafts((p) => ({ ...p, [rev.id]: e.target.value }))
                        }
                        placeholder="Type what you remember before revealing..."
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca]"
                      />
                      <button
                        type="button"
                        onClick={() => setRevealedRevIds((p) => ({ ...p, [rev.id]: true }))}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Check Reference Answer
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 space-y-2.5 text-xs">
                      <div className="text-[#5e5240] dark:text-[#c5b79e]">
                        <strong className="text-[#29251d] dark:text-[#eee2ca]">Model Answer: </strong>
                        {rev.modelAnswer}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateRevision(rev.id, true)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#5f684f] hover:bg-[#4e5640] text-[#fbf6ea] dark:bg-[#89946f] dark:hover:bg-[#9aa67e] dark:text-[#1d1a15] cursor-pointer"
                        >
                          Recalled Accurately (Advance Interval)
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateRevision(rev.id, false)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#945a3e]/50 text-[#945a3e] dark:text-[#d98c6e] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer"
                        >
                          Forgot Key Part (Reschedule 1-Day)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Weekend Blurting Method */}
      {activeTab === 'blurting' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              <div>
                <h2 className="text-lg font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  Sunday Assignment: Blurting Method
                </h2>
                <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
                  Only the topic heading is given. No hints, formulas, or summaries until you submit your unassisted recall.
                </p>
              </div>
              <select
                value={blurtingTopic}
                onChange={(e) => setBlurtingTopic(e.target.value)}
                aria-label="Blurting assignment topic"
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca]"
              >
                {trackMat.blurtingTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20">
              <div className="text-xs text-[#5e5240] dark:text-[#c5b79e]">HEADING</div>
              <div className="text-xl font-bold text-[#29251d] dark:text-[#eee2ca] mt-0.5">
                {blurtingTopic}
              </div>
            </div>

            <form onSubmit={handleBlurtingSubmit} className="mt-4 space-y-3">
              <textarea
                rows={7}
                value={blurtingText}
                onChange={(e) => setBlurtingText(e.target.value)}
                placeholder={
                  track === 'jee'
                    ? 'Write down everything you remember: energy bands, intrinsic vs extrinsic doping, Mass Action Law, depletion layer, parallel-axis theorem...'
                    : track === 'neet'
                    ? 'Write down everything you remember: SA node depolarization, QRS complex, oxygen-haemoglobin P50 shift, Bohr effect, nephron counter-current...'
                    : 'Write down everything you remember: Money Multiplier & CRR, Repo vs Reverse Repo transmission, Article 356 safeguards, monsoon ITCZ dynamics...'
                }
                className="w-full p-3.5 text-sm rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca] focus:outline-none focus:ring-2 focus:ring-[#c3a47b]"
              />
              {blurtingError && (
                <p className="text-xs text-[#945a3e] dark:text-[#d98c6e]">{blurtingError}</p>
              )}
              <button
                type="submit"
                disabled={blurtingLoading}
                className="px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg cursor-pointer disabled:opacity-50"
              >
                {blurtingLoading ? 'Evaluating Recall Against Syllabus...' : 'Submit & Compare Against Course Material'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#29251d] dark:text-[#eee2ca] pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              AI Blurting Diagnostic Report
            </h3>
            {blurtingResult ? (
              <div className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20">
                    <div className="font-mono text-lg font-bold tabular-nums text-[#29251d] dark:text-[#eee2ca]">
                      {blurtingResult.accuracyScore}%
                    </div>
                    <div className="text-[#5e5240] dark:text-[#c5b79e]">Accuracy</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20">
                    <div className="font-mono text-lg font-bold tabular-nums text-[#29251d] dark:text-[#eee2ca]">
                      {blurtingResult.completenessScore}%
                    </div>
                    <div className="text-[#5e5240] dark:text-[#c5b79e]">Completeness</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20">
                    <div className="font-mono text-lg font-bold tabular-nums text-[#29251d] dark:text-[#eee2ca]">
                      {blurtingResult.clarityScore}%
                    </div>
                    <div className="text-[#5e5240] dark:text-[#c5b79e]">Clarity</div>
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-[#5f684f] dark:text-[#89946f] mb-1">
                    Recalled Correctly
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[#5e5240] dark:text-[#c5b79e]">
                    {blurtingResult.coveredConcepts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="font-semibold text-[#945a3e] dark:text-[#d98c6e] mb-1">
                    Missing Concepts to Revisit
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[#5e5240] dark:text-[#c5b79e]">
                    {blurtingResult.missingConcepts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-[#e5d9bf] dark:border-[#c3a47b]/15 text-[#5e5240] dark:text-[#c5b79e]">
                  <strong className="text-[#29251d] dark:text-[#eee2ca]">Concept Connections: </strong>
                  {blurtingResult.conceptConnections}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#5e5240] dark:text-[#c5b79e]">
                <Brain className="w-6 h-6 mx-auto mb-2 text-[#8b673c] dark:text-[#c3a47b]" />
                Submit your unassisted writeup to reveal missing syllabus links and a targeted revision plan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Socratic AI Tutor & Handwritten Answer Grader */}
      {activeTab === 'tutor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Socratic & 24/7 AI Tutor */}
          <div className="lg:col-span-6 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              <div>
                <h2 className="text-lg font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  24/7 Socratic AI Tutor
                </h2>
                <p className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                  Guides you step by step with hints instead of spoiling answers immediately.
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-[#f4ecd8] dark:bg-[#1d1a15] rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/20">
                <button
                  type="button"
                  onClick={() => setTutorMode('socratic')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                    tutorMode === 'socratic'
                      ? 'bg-[#29251d] text-[#eee2ca] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                      : 'text-[#5e5240] dark:text-[#c5b79e]'
                  }`}
                >
                  Socratic Mode
                </button>
                <button
                  type="button"
                  onClick={() => setTutorMode('direct')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                    tutorMode === 'direct'
                      ? 'bg-[#29251d] text-[#eee2ca] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                      : 'text-[#5e5240] dark:text-[#c5b79e]'
                  }`}
                >
                  Full Explanation
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              {tutorMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#8b673c] text-[#fbf6ea] dark:bg-[#c3a47b] dark:text-[#1d1a15] ml-8'
                      : 'bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 text-[#29251d] dark:text-[#eee2ca] mr-8'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleTutorSend} className="mt-4 flex gap-2">
              <input
                type="text"
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                placeholder="Ask a conceptual doubt (e.g., Why does depletion width shrink in forward bias?)"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca]"
              />
              <button
                type="submit"
                disabled={tutorLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {tutorLoading ? '...' : 'Send'}
              </button>
            </form>
          </div>

          {/* AI Subjective & Handwritten Answer Grader */}
          <div className="lg:col-span-6 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#29251d] dark:text-[#eee2ca]">
              AI Handwritten &amp; Subjective Answer Grader
            </h2>
            <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              Upload a photo of your notebook derivation or type your subjective answer for step-by-step evaluation. Human mentors can review or override AI marks.
            </p>

            <form onSubmit={handleGradeAnswer} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#29251d] dark:text-[#eee2ca] mb-1">
                  Prompt Question
                </label>
                <input
                  type="text"
                  value={graderQuestion}
                  onChange={(e) => setGraderQuestion(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#29251d] dark:text-[#eee2ca] mb-1">
                  Typed Steps or Derivation
                </label>
                <textarea
                  rows={3}
                  value={graderAnswer}
                  onChange={(e) => setGraderAnswer(e.target.value)}
                  placeholder="Write your derivation steps here, or attach a handwritten notebook photo below..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer">
                  <FileUp className="w-3.5 h-3.5" />
                  <span>{graderImage ? graderImage.name : 'Upload Notebook Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                <button
                  type="submit"
                  disabled={graderLoading}
                  className="px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {graderLoading ? 'Evaluating Steps...' : 'Grade Submission'}
                </button>
              </div>
            </form>

            {graderResult && (
              <div className="mt-4 p-4 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#29251d] dark:text-[#eee2ca]">
                    AI Evaluation Score
                  </span>
                  <span className="font-mono text-base font-bold tabular-nums text-[#8b673c] dark:text-[#c3a47b]">
                    {graderResult.score} / 100
                  </span>
                </div>
                <p className="text-[#29251d] dark:text-[#eee2ca]">{graderResult.accuracy}</p>
                <div>
                  <span className="font-semibold text-[#945a3e] dark:text-[#d98c6e]">Missing Steps: </span>
                  <span className="text-[#5e5240] dark:text-[#c5b79e]">
                    {graderResult.missingSteps.join(' · ')}
                  </span>
                </div>
                <p className="text-[#5e5240] dark:text-[#c5b79e]">{graderResult.mentorFeedback}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: What-If Sandboxes, 3D Crystal Lattice, & Common Trap Simulator */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Physics Projectile Sandbox */}
            <div className="lg:col-span-7 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b]" />
                  <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                    Physics What-If Sandbox: Projectile Kinematics
                  </h2>
                </div>
                <span className="text-xs font-mono tabular-nums text-[#5e5240] dark:text-[#c5b79e]">
                  R = {maxRange.toFixed(1)}m · H = {maxHeight.toFixed(1)}m
                </span>
              </div>

              <div className="mt-4 bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-lg p-3">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
                  <line
                    x1="20"
                    y1={svgHeight - 16}
                    x2={svgWidth - 10}
                    y2={svgHeight - 16}
                    stroke="currentColor"
                    className="text-[#c5b79e] dark:text-[#c3a47b]/30"
                    strokeWidth="1.5"
                  />
                  <path
                    d={pathPoints}
                    fill="none"
                    stroke="#c3a47b"
                    strokeWidth="2.5"
                  />
                  <circle cx="20" cy={svgHeight - 16} r="4" fill="#c3a47b" />
                </svg>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1 font-medium text-[#29251d] dark:text-[#eee2ca]">
                    <span>Launch Speed (u)</span>
                    <span className="font-mono tabular-nums">{projSpeed} m/s</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    value={projSpeed}
                    onChange={(e) => setProjSpeed(Number(e.target.value))}
                    className="w-full accent-[#8b673c] dark:accent-[#c3a47b]"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1 font-medium text-[#29251d] dark:text-[#eee2ca]">
                    <span>Angle (θ)</span>
                    <span className="font-mono tabular-nums">{projAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={80}
                    value={projAngle}
                    onChange={(e) => setProjAngle(Number(e.target.value))}
                    className="w-full accent-[#8b673c] dark:accent-[#c3a47b]"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1 font-medium text-[#29251d] dark:text-[#eee2ca]">
                    <span>Gravity (g)</span>
                    <span className="font-mono tabular-nums">{projGravity.toFixed(1)} m/s²</span>
                  </div>
                  <input
                    type="range"
                    min={1.6}
                    max={20}
                    step={0.2}
                    value={projGravity}
                    onChange={(e) => setProjGravity(Number(e.target.value))}
                    className="w-full accent-[#8b673c] dark:accent-[#c3a47b]"
                  />
                </div>
              </div>
            </div>

            {/* Chemistry pH Sandbox */}
            <div className="lg:col-span-5 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca] pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
                  Chemistry What-If Sandbox: Weak Acid pH
                </h2>
                <div className="mt-4 p-4 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#5e5240] dark:text-[#c5b79e]">Computed Solution pH</div>
                    <div className="text-3xl font-bold font-mono tabular-nums text-[#29251d] dark:text-[#eee2ca] mt-0.5">
                      {computedPh.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xs text-right font-mono text-[#5e5240] dark:text-[#c5b79e]">
                    <div>CH₃COOH (aq)</div>
                    <div>pKa = {pKa.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-4 h-3 w-full rounded-full bg-gradient-to-r from-[#a96346] via-[#c3a47b] to-[#5f684f] relative">
                  <div
                    className="w-3.5 h-5 -top-1 bg-[#29251d] dark:bg-[#eee2ca] rounded-sm absolute border border-[#fbf6ea] dark:border-[#1d1a15]"
                    style={{ left: `calc(${(computedPh / 14) * 100}% - 7px)` }}
                  />
                </div>
              </div>

              <div className="mt-5 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1 font-medium text-[#29251d] dark:text-[#eee2ca]">
                    <span>Molar Concentration (C)</span>
                    <span className="font-mono tabular-nums">{chemConc.toFixed(2)} M</span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={1}
                    step={0.01}
                    value={chemConc}
                    onChange={(e) => setChemConc(Number(e.target.value))}
                    className="w-full accent-[#8b673c] dark:accent-[#c3a47b]"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1 font-medium text-[#29251d] dark:text-[#eee2ca]">
                    <span>Temperature (T)</span>
                    <span className="font-mono tabular-nums">{chemTemp} K</span>
                  </div>
                  <input
                    type="range"
                    min={273}
                    max={350}
                    value={chemTemp}
                    onChange={(e) => setChemTemp(Number(e.target.value))}
                    className="w-full accent-[#8b673c] dark:accent-[#c3a47b]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive 3D Crystal Lattice + Common Trap Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
                <div>
                  <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                    3D Silicon Crystal Lattice Explorer
                  </h2>
                  <p className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                    Rotate in 3D &amp; toggle substitutional donor (P) or acceptor (B) dopant atoms.
                  </p>
                </div>
                <div className="flex gap-1 p-1 bg-[#f4ecd8] dark:bg-[#1d1a15] rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/20">
                  {(['intrinsic', 'n-type', 'p-type'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDopingMode(m)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize cursor-pointer ${
                        dopingMode === m
                          ? 'bg-[#29251d] text-[#eee2ca] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                          : 'text-[#5e5240] dark:text-[#c5b79e]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-lg p-3">
                <canvas ref={canvasRef} width={360} height={220} className="max-w-full" />
                <div className="w-full grid grid-cols-3 gap-3 mt-2 text-xs text-[#5e5240] dark:text-[#c5b79e]">
                  <label className="space-y-1">
                    <span>Yaw</span>
                    <input
                      type="range"
                      min={-3.14}
                      max={3.14}
                      step={0.05}
                      value={rotY}
                      onChange={(e) => setRotY(Number(e.target.value))}
                      className="w-full accent-[#8b673c] dark:accent-[#c3a47b]"
                    />
                  </label>
                  <label className="space-y-1">
                    <span>Pitch</span>
                    <input
                      type="range"
                      min={-1.5}
                      max={1.5}
                      step={0.05}
                      value={rotX}
                      onChange={(e) => setRotX(Number(e.target.value))}
                      className="w-full accent-[#8b673c] dark:accent-[#c3a47b]"
                    />
                  </label>
                  <label className="space-y-1">
                    <span>Zoom</span>
                    <input
                      type="range"
                      min={0.7}
                      max={1.4}
                      step={0.05}
                      value={zoomScale}
                      onChange={(e) => setZoomScale(Number(e.target.value))}
                      className="w-full accent-[#8b673c] dark:accent-[#c3a47b]"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Common Trap Simulator */}
            <div className="lg:col-span-6 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#945a3e] dark:text-[#d98c6e]" />
                  <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                    Common Trap Simulator
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTrapIdx((i) => (i + 1) % trackTraps.length);
                    setSelectedTrapStep(null);
                  }}
                  className="text-xs font-medium text-[#8b673c] dark:text-[#c3a47b] hover:underline cursor-pointer"
                >
                  Next Puzzle
                </button>
              </div>

              <div className="mt-3 text-sm font-semibold text-[#29251d] dark:text-[#eee2ca]">
                {trap.title}
              </div>
              <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5 mb-3">
                Click the exact derivation step where the reasoning becomes invalid.
              </p>

              <div className="space-y-2">
                {trap.steps.map((st, idx) => {
                  const picked = selectedTrapStep === idx;
                  const correctPick = picked && idx === trap.bugStepIndex;
                  const wrongPick = picked && idx !== trap.bugStepIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedTrapStep(idx)}
                      className={`w-full text-left p-3 text-xs rounded-lg border transition-colors cursor-pointer ${
                        correctPick
                          ? 'border-[#5f684f] dark:border-[#89946f] bg-[#5f684f]/15 dark:bg-[#89946f]/20 text-[#29251d] dark:text-[#eee2ca]'
                          : wrongPick
                          ? 'border-[#a96346] dark:border-[#d98c6e] bg-[#a96346]/15 dark:bg-[#a96346]/25 text-[#945a3e] dark:text-[#f2c4b3]'
                          : 'border-[#dccfb4] dark:border-[#c3a47b]/20 text-[#29251d] dark:text-[#eee2ca] hover:border-[#8b673c] dark:hover:border-[#c3a47b]'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>

              {selectedTrapStep !== null && (
                <div className="mt-3 p-3 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 text-xs text-[#29251d] dark:text-[#eee2ca] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5f684f] dark:text-[#89946f] shrink-0 mt-0.5" />
                  <span>{trap.explanation}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Track-Specific Live Mathematical Simulators, Rank Predictor & PYQ ELO Arena */}
      {activeTab === 'pyq-sim' && (
        <ExamSimAndPyq
          track={track}
          elo={elo}
          onUpdateEloAndXp={onUpdateEloAndXp}
        />
      )}
    </div>
  );
};
