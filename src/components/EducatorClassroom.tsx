import React, { useEffect, useRef, useState } from 'react';
import {
  Brain,
  Download,
  ExternalLink,
  Grid,
  Play,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { TRACK_CONFIG } from '../data/ecosystem';
import type { ExamTrack } from '../types/mindforge';

interface EducatorClassroomProps {
  track: ExamTrack;
  savedNotes: Array<{ id: number; text: string }>;
  onAddNote: (text: string) => void;
  onDeleteNote: (id: number) => void;
  onOpenKnowledgeVault: () => void;
}

interface Stroke {
  color: string;
  size: number;
  points: Array<{ x: number; y: number }>;
}

const PEN_SWATCHES = [
  { hex: '#c3a47b', label: 'Gold Parchment' },
  { hex: '#89946f', label: 'Sage' },
  { hex: '#d98c6e', label: 'Terracotta Clay' },
  { hex: '#f0cf88', label: 'Warm Ochre' },
  { hex: '#eee2ca', label: 'Cream Chalk' },
];

export const EducatorClassroom: React.FC<EducatorClassroomProps> = ({
  track,
  savedNotes,
  onAddNote,
  onDeleteNote,
  onOpenKnowledgeVault,
}) => {
  const cfg = TRACK_CONFIG[track];
  const [videoIdx, setVideoIdx] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  // Interactive HTML5 Whiteboard state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [wbColor, setWbColor] = useState('#c3a47b');
  const [wbSize, setWbSize] = useState(3);
  const [wbShowGrid, setWbShowGrid] = useState(true);
  const strokesRef = useRef<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);

  // Contextual AI Tutor Modal
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([]);

  useEffect(() => {
    setVideoIdx(0);
    setStartSec(0);
    setAutoplay(false);
  }, [track]);

  const currentVideo = cfg.videos[videoIdx] || cfg.videos[0];

  useEffect(() => {
    setAiMessages([
      {
        role: 'ai',
        text: `You're watching "${currentVideo.title}" by ${currentVideo.teacher}. Ask me to break down any formula, diagram, or NCERT line from this lecture.`,
      },
    ]);
  }, [currentVideo.id, currentVideo.title, currentVideo.teacher]);

  const redrawWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#1d1a15';
    ctx.fillRect(0, 0, w, h);

    if (wbShowGrid) {
      ctx.strokeStyle = 'rgba(195, 164, 123, 0.09)';
      ctx.lineWidth = 1;
      for (let x = 24; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 24; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    strokesRef.current.forEach((s) => {
      if (s.points.length === 0) return;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      if (s.points.length === 1) {
        ctx.lineTo(s.points[0].x + 0.5, s.points[0].y + 0.5);
      }
      ctx.stroke();
    });
  };

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
      }
      redrawWhiteboard();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [wbShowGrid]);

  useEffect(() => {
    redrawWhiteboard();
  }, [wbShowGrid]);

  const getCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleStartDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    drawingRef.current = true;
    const pt = getCoords(e);
    const stroke: Stroke = { color: wbColor, size: wbSize, points: [pt] };
    activeStrokeRef.current = stroke;
    strokesRef.current.push(stroke);
    redrawWhiteboard();
  };

  const handleMoveDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!drawingRef.current || !activeStrokeRef.current) return;
    activeStrokeRef.current.points.push(getCoords(e));
    redrawWhiteboard();
  };

  const handleEndDraw = () => {
    drawingRef.current = false;
    activeStrokeRef.current = null;
  };

  const handleClearBoard = () => {
    strokesRef.current = [];
    redrawWhiteboard();
  };

  const handleDownloadBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `MindForge_${track.toUpperCase()}_Whiteboard.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleAddStudentNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    onAddNote(noteDraft.trim());
    setNoteDraft('');
  };

  const handleSendAi = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = aiInput.trim();
    if (!q || aiLoading) return;
    setAiMessages((prev) => [...prev, { role: 'user', text: q }]);
    setAiInput('');
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'socratic',
          message: q,
          context: `${cfg.badge} Lecture: ${currentVideo.title} by ${currentVideo.teacher}. Key notes: ${currentVideo.notes}`,
        }),
      });
      const data = await res.json();
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text:
            data.reply ||
            `Recall the core boundary condition from "${currentVideo.title}" and test its limiting case on your Study Whiteboard.`,
        },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Think about the limiting case in "${currentVideo.title}"—sketch the free-body or circuit diagram on the Study Whiteboard and verify conservation laws.`,
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const embedSrc = `https://www.youtube-nocookie.com/embed/${currentVideo.id}?rel=0&modestbranding=1${
    startSec > 0 ? `&start=${startSec}` : ''
  }${autoplay ? '&autoplay=1' : ''}`;

  const directUrl = `https://www.youtube.com/watch?v=${currentVideo.id}${
    startSec > 0 ? `&t=${startSec}s` : ''
  }`;

  return (
    <div className="space-y-6">
      {/* Hero Educator Strip */}
      <div className="rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/30 bg-gradient-to-r from-[#211e18] via-[#29251d] to-[#1d1a15] text-[#eee2ca] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#c3a47b]/20 text-[#dbc39c] font-semibold uppercase tracking-wide">
              {cfg.heroTag}
            </span>
            <span className="text-[#c5b79e]">
              Verified Educator Lectures · Interactive Study Whiteboard
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#eee2ca]">{cfg.heroTitle}</h2>
          <p className="text-xs text-[#c5b79e] max-w-2xl">{cfg.heroSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={onOpenKnowledgeVault}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-[#1d1a15] bg-[#c3a47b] hover:bg-[#dbc39c] transition-colors shrink-0 cursor-pointer"
        >
          Open Knowledge Vault &amp; 25+ Portals →
        </button>
      </div>

      {/* Educator Lecture Selector */}
      <div className="rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b673c] dark:text-[#c3a47b]">
            Select Verified Educator Lecture ({cfg.videos.length} Available)
          </span>
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#a96346] dark:text-[#d98c6e] hover:underline"
          >
            Open Video Directly on YouTube (Fallback)
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {cfg.videos.map((v, idx) => {
            const active = idx === videoIdx;
            return (
              <button
                key={`${v.id}-${idx}`}
                type="button"
                onClick={() => {
                  setVideoIdx(idx);
                  setStartSec(0);
                  setAutoplay(true);
                }}
                className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#eadfc7] dark:bg-[#343025] border-[#8b673c] dark:border-[#c3a47b]'
                    : 'bg-[#f4ecd8] dark:bg-[#1d1a15] border-[#dccfb4] dark:border-[#c3a47b]/20 hover:border-[#8b673c] dark:hover:border-[#c3a47b]/60'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-semibold text-[#8b673c] dark:text-[#c3a47b] mb-1">
                  <span className="truncate">{v.teacher}</span>
                  <span className="font-mono text-[#5e5240] dark:text-[#c5b79e] ml-1 shrink-0">
                    {v.duration}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#29251d] dark:text-[#eee2ca] line-clamp-2">
                  {v.title}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split Classroom: YouTube Video + Live Interactive Study Whiteboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Video & Chapter Timestamps + Notes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl overflow-hidden border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#1d1a15]">
            <div className="relative w-full aspect-video bg-[#14120e]">
              <iframe
                key={`${currentVideo.id}-${startSec}-${autoplay}`}
                className="w-full h-full"
                src={embedSrc}
                title={currentVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="p-4 bg-[#211e18] border-t border-[#c3a47b]/20 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#c3a47b]">
                    {currentVideo.teacher}
                  </span>
                  <h3 className="text-base font-bold text-[#eee2ca]">{currentVideo.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAiOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1d1a15] bg-[#c3a47b] hover:bg-[#dbc39c] cursor-pointer"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Ask Socratic Tutor
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c5b79e]">
                  Jump to Lecture Chapter Timestamp:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentVideo.chapters.map((ch) => (
                    <button
                      key={ch.label}
                      type="button"
                      onClick={() => {
                        setStartSec(ch.sec);
                        setAutoplay(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#29251d] border border-[#c3a47b]/25 text-[#eee2ca] hover:bg-[#c3a47b] hover:text-[#1d1a15] text-[11px] font-mono font-semibold transition-colors cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5" />
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Structured Educator Takeaways & Saved Browser Notes */}
          <div className="rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#29251d] dark:text-[#eee2ca]">
                Educator Key Takeaways &amp; Your Saved Notes
              </h4>
              <span className="text-[11px] font-mono text-[#5f684f] dark:text-[#89946f]">
                Auto-saved locally
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-[#e5d9bf] dark:border-[#c3a47b]/20 bg-[#f4ecd8] dark:bg-[#1d1a15] text-xs leading-relaxed text-[#29251d] dark:text-[#eee2ca]">
              {currentVideo.notes}
            </div>

            <form onSubmit={handleAddStudentNote} className="flex gap-2">
              <input
                type="text"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Add your personal formula, article, or revision takeaway..."
                className="flex-1 px-3 py-2 rounded-lg text-xs border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca] focus:outline-none focus:border-[#8b673c] dark:focus:border-[#c3a47b]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Save Note
              </button>
            </form>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {savedNotes.map((n) => (
                <div
                  key={n.id}
                  className="p-2.5 rounded-lg border border-[#e5d9bf] dark:border-[#c3a47b]/15 bg-[#f4ecd8] dark:bg-[#1d1a15] flex justify-between items-center gap-2 text-xs text-[#29251d] dark:text-[#eee2ca]"
                >
                  <span>{n.text}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteNote(n.id)}
                    aria-label="Delete note"
                    className="text-[#5e5240] dark:text-[#c5b79e] hover:text-[#a96346] dark:hover:text-[#d98c6e] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive HTML5 Canvas Study Whiteboard */}
        <div className="lg:col-span-5 rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/30 bg-[#fbf6ea] dark:bg-[#211e18] p-4 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8b673c] dark:text-[#c3a47b]">
                Interactive Scratchpad
              </span>
              <h3 className="font-bold text-base text-[#29251d] dark:text-[#eee2ca]">
                Live Study Whiteboard
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWbShowGrid((g) => !g)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-xs font-semibold text-[#29251d] dark:text-[#eee2ca] cursor-pointer"
              >
                <Grid className="w-3 h-3" />
                Grid: {wbShowGrid ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={handleClearBoard}
                className="px-2.5 py-1 rounded-md bg-[#a96346]/15 dark:bg-[#d98c6e]/20 text-[#a96346] dark:text-[#d98c6e] text-xs font-semibold cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleDownloadBoard}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#5f684f] dark:bg-[#89946f] text-[#fbf6ea] dark:text-[#1d1a15] text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3 h-3" />
                PNG
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-[#e5d9bf] dark:border-[#c3a47b]/20 bg-[#f4ecd8] dark:bg-[#1d1a15]">
            <div className="flex items-center gap-1.5">
              {PEN_SWATCHES.map((sw) => (
                <button
                  key={sw.hex}
                  type="button"
                  onClick={() => setWbColor(sw.hex)}
                  title={sw.label}
                  className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-transform ${
                    wbColor === sw.hex
                      ? 'scale-110 border-[#29251d] dark:border-[#eee2ca]'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: sw.hex }}
                />
              ))}
              <button
                type="button"
                onClick={() => setWbColor('#1d1a15')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer ${
                  wbColor === '#1d1a15'
                    ? 'bg-[#8b673c] text-[#fbf6ea] border-[#8b673c] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                    : 'bg-[#29251d] text-[#eee2ca] border-[#c3a47b]/30'
                }`}
              >
                Eraser
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#5e5240] dark:text-[#c5b79e]">
              <span>Size:</span>
              <input
                type="range"
                min={2}
                max={14}
                value={wbSize}
                onChange={(e) => setWbSize(Number(e.target.value))}
                className="w-20 accent-[#8b673c] dark:accent-[#c3a47b]"
              />
            </div>
          </div>

          <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-[#c3a47b]/30 bg-[#1d1a15]">
            <canvas
              ref={canvasRef}
              onMouseDown={handleStartDraw}
              onMouseMove={handleMoveDraw}
              onMouseUp={handleEndDraw}
              onMouseLeave={handleEndDraw}
              onTouchStart={handleStartDraw}
              onTouchMove={handleMoveDraw}
              onTouchEnd={handleEndDraw}
              className="w-full h-full block cursor-crosshair touch-none"
            />
          </div>
          <p className="text-[11px] text-[#5e5240] dark:text-[#c5b79e] text-center">
            Draw circuit diagrams, biological flowcharts, or polity mind maps with mouse or touch,
            then export as PNG.
          </p>
        </div>
      </div>

      {/* Contextual Socratic Tutor Modal */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 bg-[#1d1a15]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/35 rounded-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5d9bf] dark:border-[#c3a47b]/20 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#29251d] dark:text-[#eee2ca]">
                  Socratic &amp; Direct AI Doubt Tutor
                </h3>
                <p className="text-[11px] text-[#5e5240] dark:text-[#c5b79e]">
                  Contextualized to {currentVideo.teacher}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                className="p-1 text-[#5e5240] dark:text-[#c5b79e] hover:text-[#29251d] dark:hover:text-[#eee2ca] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-52 overflow-y-auto space-y-2.5 p-3 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#e5d9bf] dark:border-[#c3a47b]/20 text-xs">
              {aiMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg ${
                    m.role === 'user'
                      ? 'bg-[#8b673c]/15 dark:bg-[#c3a47b]/15 text-right text-[#29251d] dark:text-[#eee2ca]'
                      : 'bg-[#fbf6ea] dark:bg-[#29251d] border border-[#dccfb4] dark:border-[#c3a47b]/20 text-[#29251d] dark:text-[#eee2ca]'
                  }`}
                >
                  <strong className="text-[#8b673c] dark:text-[#c3a47b]">
                    {m.role === 'user' ? 'You: ' : 'Tutor: '}
                  </strong>
                  {m.text}
                </div>
              ))}
              {aiLoading && (
                <p className="text-[11px] italic text-[#5e5240] dark:text-[#c5b79e]">
                  Formulating Socratic hint...
                </p>
              )}
            </div>

            <form onSubmit={handleSendAi} className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask a conceptual question about this lecture..."
                className="flex-1 px-3 py-2 rounded-lg text-xs border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca] focus:outline-none focus:border-[#8b673c] dark:focus:border-[#c3a47b]"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Ask
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
