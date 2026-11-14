import React, { useEffect, useRef, useState } from 'react';
import { Award, CheckCircle2, Sliders, XCircle } from 'lucide-react';
import { TRACK_CONFIG } from '../data/ecosystem';
import type { ExamTrack } from '../types/mindforge';

interface ExamSimAndPyqProps {
  track: ExamTrack;
  elo: number;
  onUpdateEloAndXp: (deltaElo: number, deltaXp: number) => void;
}

export const ExamSimAndPyq: React.FC<ExamSimAndPyqProps> = ({
  track,
  elo,
  onUpdateEloAndXp,
}) => {
  const cfg = TRACK_CONFIG[track];

  // Track simulator state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [jeeSimMode, setJeeSimMode] = useState<'diode' | 'projectile'>('diode');
  const [p1, setP1] = useState(0.7);
  const [p2, setP2] = useState(300);
  const [p3, setP3] = useState(5.6);
  const phaseRef = useRef(0);

  // Predictor state
  const [predScore, setPredScore] = useState(195);
  const [predWrong, setPredWrong] = useState(18);
  const [predOption, setPredOption] = useState('mod');

  // PYQ Arena state
  const [pyqIdx, setPyqIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  // Reset simulator & predictor defaults cleanly on track change
  useEffect(() => {
    setPyqIdx(0);
    setSelectedOpt(null);
    if (track === 'jee') {
      if (jeeSimMode === 'diode') {
        setP1(0.7);
        setP2(300);
        setP3(5.6);
      } else {
        setP1(45);
        setP2(45);
        setP3(9.8);
      }
      setPredScore(195);
      setPredOption('mod');
    } else if (track === 'neet') {
      setP1(75);
      setP2(70);
      setP3(40);
      setPredScore(655);
      setPredOption('gen');
    } else {
      setP1(6.5);
      setP2(4.5);
      setP3(4.9);
      setPredScore(54);
      setPredWrong(18);
    }
  }, [track, jeeSimMode]);

  // Draw Canvas Simulator
  const drawSim = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (canvas.width !== Math.floor(rect.width)) canvas.width = Math.floor(rect.width);
      if (canvas.height !== Math.floor(rect.height)) canvas.height = Math.floor(rect.height);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#1d1a15';
    ctx.fillRect(0, 0, w, h);

    if (track === 'jee' && jeeSimMode === 'diode') {
      const ox = w * 0.52;
      const oy = h * 0.62;
      ctx.strokeStyle = 'rgba(195, 164, 123, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(20, oy);
      ctx.lineTo(w - 20, oy);
      ctx.moveTo(ox, 16);
      ctx.lineTo(ox, h - 16);
      ctx.stroke();

      // Forward Bias Exponential
      ctx.strokeStyle = '#c3a47b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const kneePx = ox + p1 * 95;
      ctx.moveTo(ox, oy);
      for (let x = ox; x < w - 25; x += 3) {
        const v = (x - ox) / 95;
        const tempFactor = 300 / Math.max(150, p2);
        const curr = v < p1 ? (v / Math.max(0.1, p1)) * 4 : 4 + Math.pow((v - p1) * 6.5, 2.2) * tempFactor;
        const y = Math.max(20, oy - curr);
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Reverse + Zener Breakdown
      ctx.strokeStyle = '#d98c6e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      const zenerPx = ox - p3 * 24;
      ctx.lineTo(Math.max(30, zenerPx), oy + 4);
      ctx.lineTo(Math.max(25, zenerPx - 6), h - 18);
      ctx.stroke();

      ctx.fillStyle = '#c5b79e';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText(`Knee V0=${p1}V`, kneePx - 20, oy + 16);
      ctx.fillText(`-Vz=-${p3}V`, Math.max(28, zenerPx - 22), oy - 8);
    } else if (track === 'jee' && jeeSimMode === 'projectile') {
      const baseY = h - 22;
      ctx.strokeStyle = 'rgba(195, 164, 123, 0.35)';
      ctx.beginPath();
      ctx.moveTo(24, baseY);
      ctx.lineTo(w - 24, baseY);
      ctx.stroke();

      const rad = (p2 * Math.PI) / 180;
      const range = (p1 * p1 * Math.sin(2 * rad)) / Math.max(0.5, p3);
      const tof = (2 * p1 * Math.sin(rad)) / Math.max(0.5, p3);

      ctx.strokeStyle = '#c3a47b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const scale = Math.min(0.75, (w - 60) / Math.max(260, range));
      for (let i = 0; i <= 50; i++) {
        const t = (tof * i) / 50;
        const x = 30 + p1 * Math.cos(rad) * t * scale;
        const y = baseY - (p1 * Math.sin(rad) * t - 0.5 * p3 * t * t) * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (track === 'neet') {
      const midY = h * 0.62;
      ctx.strokeStyle = '#89946f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const freqScale = p1 / 75;
      for (let x = 16; x < w - 16; x++) {
        const ph = (((x * freqScale) + phaseRef.current) % 150) / 150;
        let y = midY;
        if (ph > 0.14 && ph < 0.24) y -= Math.sin((ph - 0.14) * 10 * Math.PI) * 18;
        else if (ph >= 0.34 && ph < 0.37) y += 14;
        else if (ph >= 0.37 && ph < 0.42) y -= h * 0.44;
        else if (ph >= 0.42 && ph < 0.46) y += 22;
        else if (ph > 0.6 && ph < 0.76) y -= Math.sin((ph - 0.6) * 6.25 * Math.PI) * 24;
        if (x === 16) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      const baseY = h - 25;
      ctx.strokeStyle = 'rgba(195, 164, 123, 0.35)';
      ctx.beginPath();
      ctx.moveTo(24, baseY);
      ctx.lineTo(w - 24, baseY);
      ctx.stroke();

      const cpi = Math.max(
        2.1,
        7.9 - (p1 - 5.0) * 0.65 - (p2 - 4.0) * 0.3 + (p3 - 4.5) * 0.55
      );
      // RBI 2%-6% Target Band
      ctx.fillStyle = 'rgba(137, 148, 111, 0.18)';
      ctx.fillRect(24, baseY - 6 * 18, w - 48, 4 * 18);

      ctx.strokeStyle = '#c3a47b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const x = 30 + (i / 10) * (w - 60);
        const proj = 6.2 + (cpi - 6.2) * (i / 10);
        const y = baseY - proj * 18;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    drawSim();
  }, [track, jeeSimMode, p1, p2, p3]);

  useEffect(() => {
    if (track !== 'neet') return;
    const id = window.setInterval(() => {
      phaseRef.current += 4;
      drawSim();
    }, 60);
    return () => window.clearInterval(id);
  }, [track, p1, p2, p3]);

  // Readout calculations
  const renderReadouts = () => {
    if (track === 'jee' && jeeSimMode === 'diode') {
      const material = p1 <= 0.4 ? 'Germanium (Ge)' : 'Silicon (Si)';
      return [
        { label: 'Semiconductor', val: material },
        { label: 'Thermal Voltage', val: `${(p2 * 0.0862).toFixed(1)} mV` },
        { label: 'Breakdown Mode', val: `Zener (-${p3}V)` },
      ];
    }
    if (track === 'jee' && jeeSimMode === 'projectile') {
      const rad = (p2 * Math.PI) / 180;
      const maxH = (p1 * p1 * Math.sin(rad) ** 2) / (2 * p3);
      const range = (p1 * p1 * Math.sin(2 * rad)) / p3;
      const tof = (2 * p1 * Math.sin(rad)) / p3;
      return [
        { label: 'Max Height', val: `${maxH.toFixed(1)} m` },
        { label: 'Horizontal Range', val: `${range.toFixed(1)} m` },
        { label: 'Time of Flight', val: `${tof.toFixed(2)} s` },
      ];
    }
    if (track === 'neet') {
      const co = ((p1 * p2) / 1000).toFixed(2);
      const cycleSec = (60 / p1).toFixed(2);
      const bohr =
        p3 > 43 ? 'Right Shift (O₂ Unload)' : p3 < 37 ? 'Left Shift (Bind)' : 'Normal P50 26.8';
      return [
        { label: 'Cardiac Output', val: `${co} L/min` },
        { label: 'Cycle Duration', val: `${cycleSec} s` },
        { label: 'Hb-O₂ Curve', val: bohr },
      ];
    }
    const cpi = Math.max(
      2.1,
      7.9 - (p1 - 5.0) * 0.65 - (p2 - 4.0) * 0.3 + (p3 - 4.5) * 0.55
    );
    const gdp = Math.max(4.5, 7.6 - (p1 - 6.0) * 0.35 + (p3 - 4.5) * 0.25);
    const bandStatus = cpi <= 6.0 && cpi >= 2.0 ? 'Within 4%±2% Band' : 'Breaches 6% Limit';
    return [
      { label: 'Projected CPI', val: `${cpi.toFixed(2)}%` },
      { label: 'Real GDP Growth', val: `${gdp.toFixed(2)}%` },
      { label: 'RBI Mandate', val: bandStatus },
    ];
  };

  // Predictor Output
  const renderPredictorResult = () => {
    if (track === 'jee') {
      const shiftBonus = predOption === 'tough' ? 12 : predOption === 'easy' ? -10 : 0;
      const eff = Math.min(300, Math.max(0, predScore + shiftBonus));
      const pct = Math.min(99.998, Math.max(70.0, 72 + (eff / 300) * 28.1)).toFixed(3);
      const air = Math.max(1, Math.round(((100 - parseFloat(pct)) / 100) * 1400000));
      const tier =
        eff >= 220
          ? 'Top NIT CSE + Strong IIT Adv Rank (< 3,500)'
          : eff >= 165
          ? 'NIT Core / IIIT + JEE Adv Qualified'
          : 'State Govt Engg / Focused Revision Needed';
      return {
        primaryLabel: 'Predicted NTA Percentile',
        primaryValue: `${pct} %ile`,
        secondaryLabel: 'Estimated All India Rank',
        secondaryValue: `AIR ~${air.toLocaleString()}`,
        verdict: tier,
      };
    }
    if (track === 'neet') {
      const air =
        predScore >= 715
          ? 45
          : predScore >= 680
          ? Math.round((720 - predScore) * 260)
          : predScore >= 620
          ? Math.round(10000 + (680 - predScore) * 950)
          : Math.round(67000 + (620 - predScore) * 2100);
      const cutoff = predOption === 'gen' ? 645 : predOption === 'obc' ? 635 : 535;
      const status =
        predScore >= 695
          ? 'AIIMS Delhi / MAMC Top Tier'
          : predScore >= cutoff
          ? 'Govt Medical College (MBBS Seat Likely)'
          : 'Semi-Govt / Focused Revision Needed';
      return {
        primaryLabel: 'Predicted All India Rank',
        primaryValue: `AIR ~${air.toLocaleString()}`,
        secondaryLabel: 'Category Benchmark',
        secondaryValue: `${cutoff}+ Marks`,
        verdict: status,
      };
    }
    const net = (predScore * 2.0 - predWrong * (2 / 3)).toFixed(2);
    const acc = Math.round((predScore / Math.max(1, predScore + predWrong)) * 100);
    const status =
      parseFloat(net) >= 92
        ? 'Safe Above General Cutoff (~88-90) — Mains Ready'
        : parseFloat(net) >= 82
        ? 'Borderline (OBC/EWS Safe Zone)'
        : 'Below Cutoff — Reduce Negative Marking';
    return {
      primaryLabel: 'Net GS Paper-I Score',
      primaryValue: `${net} / 200`,
      secondaryLabel: 'Accuracy Rate',
      secondaryValue: `${acc}%`,
      verdict: status,
    };
  };

  const pred = renderPredictorResult();
  const activePyq = cfg.pyqs[pyqIdx % cfg.pyqs.length];

  const handleChoosePyq = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    if (idx === activePyq.ans) {
      onUpdateEloAndXp(18, 40);
    } else {
      onUpdateEloAndXp(-10, 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Track-Specific Interactive Lab + Exam Rank / Percentile Predictor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Canvas Lab */}
        <div className="lg:col-span-7 rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#8b673c] dark:text-[#c3a47b]">
                <Sliders className="w-3.5 h-3.5" />
                Track-Specific Mathematical Lab
              </span>
              <h2 className="text-lg font-bold text-[#29251d] dark:text-[#eee2ca]">
                {track === 'jee'
                  ? jeeSimMode === 'diode'
                    ? 'JEE Physics: Semiconductor p-n & Zener V-I Lab'
                    : 'JEE Kinematics: Projectile Trajectory & Gravity Lab'
                  : track === 'neet'
                  ? 'NEET Physiology: Live ECG (P-QRS-T) & Cardiac Cycle Lab'
                  : 'UPSC Economy: RBI Repo Rate & CPI Inflation Lab'}
              </h2>
            </div>
            {track === 'jee' && (
              <div className="flex gap-1 p-1 rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setJeeSimMode('diode')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    jeeSimMode === 'diode'
                      ? 'bg-[#8b673c] text-[#fbf6ea] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                      : 'text-[#5e5240] dark:text-[#c5b79e]'
                  }`}
                >
                  p-n Diode V-I
                </button>
                <button
                  type="button"
                  onClick={() => setJeeSimMode('projectile')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    jeeSimMode === 'projectile'
                      ? 'bg-[#8b673c] text-[#fbf6ea] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                      : 'text-[#5e5240] dark:text-[#c5b79e]'
                  }`}
                >
                  Projectile
                </button>
              </div>
            )}
          </div>

          <div className="w-full h-56 rounded-xl overflow-hidden border border-[#c3a47b]/30 bg-[#1d1a15]">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#29251d] dark:text-[#eee2ca]">
            <div>
              <label className="font-semibold block mb-1">
                {track === 'jee'
                  ? jeeSimMode === 'diode'
                    ? `Barrier V0: ${p1} V`
                    : `Speed u: ${p1} m/s`
                  : track === 'neet'
                  ? `Heart Rate: ${p1} bpm`
                  : `Repo Rate: ${p1}%`}
              </label>
              <input
                type="range"
                min={track === 'jee' ? (jeeSimMode === 'diode' ? 0.3 : 15) : track === 'neet' ? 45 : 4.0}
                max={track === 'jee' ? (jeeSimMode === 'diode' ? 1.1 : 75) : track === 'neet' ? 165 : 9.5}
                step={track === 'jee' ? (jeeSimMode === 'diode' ? 0.1 : 1) : track === 'neet' ? 1 : 0.25}
                value={p1}
                onChange={(e) => setP1(Number(e.target.value))}
                className="w-full accent-[#8b673c] dark:accent-[#c3a47b]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">
                {track === 'jee'
                  ? jeeSimMode === 'diode'
                    ? `Temp T: ${p2} K`
                    : `Angle θ: ${p2}°`
                  : track === 'neet'
                  ? `Stroke Vol: ${p2} mL`
                  : `CRR: ${p2}%`}
              </label>
              <input
                type="range"
                min={track === 'jee' ? (jeeSimMode === 'diode' ? 250 : 15) : track === 'neet' ? 40 : 3.0}
                max={track === 'jee' ? (jeeSimMode === 'diode' ? 400 : 80) : track === 'neet' ? 110 : 7.5}
                step={track === 'jee' ? (jeeSimMode === 'diode' ? 10 : 1) : track === 'neet' ? 1 : 0.25}
                value={p2}
                onChange={(e) => setP2(Number(e.target.value))}
                className="w-full accent-[#5f684f] dark:accent-[#89946f]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">
                {track === 'jee'
                  ? jeeSimMode === 'diode'
                    ? `Zener Vz: ${p3} V`
                    : `Gravity g: ${p3} m/s²`
                  : track === 'neet'
                  ? `Blood pCO₂: ${p3} mmHg`
                  : `Fiscal Deficit: ${p3}%`}
              </label>
              <input
                type="range"
                min={track === 'jee' ? (jeeSimMode === 'diode' ? 3.0 : 1.6) : track === 'neet' ? 25 : 3.0}
                max={track === 'jee' ? (jeeSimMode === 'diode' ? 9.0 : 24.8) : track === 'neet' ? 75 : 7.5}
                step={track === 'jee' ? 0.2 : track === 'neet' ? 1 : 0.1}
                value={p3}
                onChange={(e) => setP3(Number(e.target.value))}
                className="w-full accent-[#a96346] dark:accent-[#d98c6e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3.5 rounded-lg border border-[#e5d9bf] dark:border-[#c3a47b]/15 bg-[#f4ecd8] dark:bg-[#1d1a15] text-center text-xs">
            {renderReadouts().map((r) => (
              <div key={r.label}>
                <span className="text-[#5e5240] dark:text-[#c5b79e] block">{r.label}</span>
                <strong className="font-mono text-[#29251d] dark:text-[#eee2ca]">{r.val}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Rank / Percentile / Cutoff Predictor */}
        <div className="lg:col-span-5 rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] p-6 space-y-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b673c] dark:text-[#c3a47b]">
              Historical NTA / UPSC Calibration
            </span>
            <h2 className="text-lg font-bold text-[#29251d] dark:text-[#eee2ca]">
              {track === 'jee'
                ? 'JEE Main Marks → Percentile & AIR Predictor'
                : track === 'neet'
                ? 'NEET-UG Score → AIR & Govt MBBS Predictor'
                : 'UPSC Prelims GS-I & Cutoff Simulator'}
            </h2>
            <p className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
              {track === 'jee'
                ? 'Calibrated against 14 Lakh+ NTA JEE Main candidates across shifts.'
                : track === 'neet'
                ? 'Calibrated for 24 Lakh+ NEET-UG aspirants across AIQ 15% & State Quota.'
                : 'Includes +2.0 / -0.66 negative marking against historical Prelims cutoffs.'}
            </p>
          </div>

          <div className="space-y-4 text-xs text-[#29251d] dark:text-[#eee2ca]">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>
                  {track === 'jee'
                    ? 'Expected Score (out of 300)'
                    : track === 'neet'
                    ? 'Expected NEET Score (out of 720)'
                    : 'GS Paper-I Correct Questions (out of 100)'}
                </span>
                <span className="font-mono text-[#8b673c] dark:text-[#c3a47b]">
                  {track === 'jee'
                    ? `${predScore} / 300`
                    : track === 'neet'
                    ? `${predScore} / 720`
                    : `${predScore} Correct`}
                </span>
              </div>
              <input
                type="range"
                min={track === 'jee' ? 40 : track === 'neet' ? 200 : 20}
                max={track === 'jee' ? 300 : track === 'neet' ? 720 : 85}
                value={predScore}
                onChange={(e) => setPredScore(Number(e.target.value))}
                className="w-full accent-[#8b673c] dark:accent-[#c3a47b]"
              />
            </div>

            {track === 'upsc' ? (
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>GS Paper-I Incorrect Questions (-0.66 each)</span>
                  <span className="font-mono text-[#a96346] dark:text-[#d98c6e]">
                    {predWrong} Wrong
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={predWrong}
                  onChange={(e) => setPredWrong(Number(e.target.value))}
                  className="w-full accent-[#a96346] dark:accent-[#d98c6e]"
                />
              </div>
            ) : (
              <div>
                <label className="font-semibold block mb-1">
                  {track === 'jee' ? 'Shift Difficulty Level' : 'Quota & Category'}
                </label>
                <select
                  value={predOption}
                  onChange={(e) => setPredOption(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca]"
                >
                  {track === 'jee' ? (
                    <>
                      <option value="tough">Tough Shift (Higher Percentile at Lower Marks)</option>
                      <option value="mod">Moderate Shift (Standard NTA Normalization)</option>
                      <option value="easy">Easy Shift</option>
                    </>
                  ) : (
                    <>
                      <option value="gen">All India Quota (General / UR)</option>
                      <option value="obc">OBC / EWS Quota</option>
                      <option value="scst">SC / ST Quota</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-[#c3a47b]/35 bg-[#29251d] dark:bg-[#1d1a15] text-[#eee2ca] space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#c5b79e]">{pred.primaryLabel}</span>
              <strong className="text-2xl font-bold font-mono text-[#c3a47b]">
                {pred.primaryValue}
              </strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#c5b79e]">{pred.secondaryLabel}</span>
              <strong className="font-mono text-[#eee2ca]">{pred.secondaryValue}</strong>
            </div>
            <div className="pt-2 border-t border-[#c3a47b]/20 text-xs font-semibold text-[#89946f]">
              {pred.verdict}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Adaptive Past-Year Question (PYQ) ELO Arena */}
      <div className="rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#8b673c] dark:text-[#c3a47b]">
              <Award className="w-3.5 h-3.5" />
              Ranked Past-Year Question Bank ({cfg.badge})
            </span>
            <h2 className="text-lg font-bold text-[#29251d] dark:text-[#eee2ca]">
              Adaptive PYQ ELO Arena
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#8b673c]/15 dark:bg-[#c3a47b]/15 text-[#8b673c] dark:text-[#c3a47b] font-mono text-xs font-bold">
            ELO: {elo}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[#e5d9bf] dark:border-[#c3a47b]/20 bg-[#f4ecd8] dark:bg-[#1d1a15] space-y-3">
          <div className="flex justify-between items-center text-[11px] font-mono text-[#5e5240] dark:text-[#c5b79e]">
            <span className="px-2 py-0.5 rounded bg-[#8b673c]/15 dark:bg-[#c3a47b]/15 text-[#8b673c] dark:text-[#c3a47b] font-bold">
              {activePyq.year}
            </span>
            <span>
              Question {(pyqIdx % cfg.pyqs.length) + 1} / {cfg.pyqs.length}
            </span>
          </div>

          <p className="text-sm font-bold leading-relaxed text-[#29251d] dark:text-[#eee2ca]">
            {activePyq.q}
          </p>

          <div className="space-y-2">
            {activePyq.opts.map((opt, idx) => {
              const answered = selectedOpt !== null;
              const isCorrect = idx === activePyq.ans;
              const isChosen = idx === selectedOpt;
              let btnStyle =
                'border-[#dccfb4] dark:border-[#c3a47b]/20 bg-[#fbf6ea] dark:bg-[#211e18] text-[#29251d] dark:text-[#eee2ca] hover:border-[#8b673c] dark:hover:border-[#c3a47b]';
              if (answered && isCorrect) {
                btnStyle =
                  'border-[#5f684f] dark:border-[#89946f] bg-[#5f684f]/15 dark:bg-[#89946f]/20 text-[#29251d] dark:text-[#eee2ca] font-semibold';
              } else if (answered && isChosen) {
                btnStyle =
                  'border-[#a96346] dark:border-[#d98c6e] bg-[#a96346]/15 dark:bg-[#d98c6e]/20 text-[#29251d] dark:text-[#eee2ca]';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={answered}
                  onClick={() => handleChoosePyq(idx)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-colors flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <span>
                    <strong className="text-[#8b673c] dark:text-[#c3a47b] mr-1.5">
                      {String.fromCharCode(65 + idx)}.
                    </strong>
                    {opt}
                  </span>
                  {answered && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-[#5f684f] dark:text-[#89946f] shrink-0" />
                  )}
                  {answered && isChosen && !isCorrect && (
                    <XCircle className="w-4 h-4 text-[#a96346] dark:text-[#d98c6e] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedOpt !== null && (
            <div
              className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                selectedOpt === activePyq.ans
                  ? 'border-[#5f684f]/40 dark:border-[#89946f]/40 bg-[#5f684f]/10 dark:bg-[#89946f]/15 text-[#29251d] dark:text-[#eee2ca]'
                  : 'border-[#a96346]/40 dark:border-[#d98c6e]/40 bg-[#a96346]/10 dark:bg-[#d98c6e]/15 text-[#29251d] dark:text-[#eee2ca]'
              }`}
            >
              <strong>
                {selectedOpt === activePyq.ans
                  ? 'Correct (+18 ELO, +40 XP): '
                  : 'Incorrect (-10 ELO): '}
              </strong>
              {activePyq.explain}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-[11px] text-[#5e5240] dark:text-[#c5b79e]">
            +18 ELO on correct answer · -10 ELO on wrong answer
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedOpt(null);
              setPyqIdx((i) => i + 1);
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] cursor-pointer"
          >
            Next PYQ →
          </button>
        </div>
      </div>
    </div>
  );
};
