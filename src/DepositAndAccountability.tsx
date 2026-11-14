import React, { useState } from 'react';
import {
  Award,
  Bell,
  Building2,
  CheckCircle2,
  Download,
  Info,
  Landmark,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type {
  DepositCourseLedger,
  GuardianNotification,
  MentorSubmission,
  UserRole,
} from '../types/mindforge';

interface DepositAndAccountabilityProps {
  role: UserRole;
  deposit: DepositCourseLedger;
  setDeposit: React.Dispatch<React.SetStateAction<DepositCourseLedger>>;
  guardianNotifications: GuardianNotification[];
  mentorSubmissions: MentorSubmission[];
  onEvaluateSubmission: (id: string, marks: number, remarks: string) => void;
  tabInterruptions: number;
}

export const DepositAndAccountability: React.FC<DepositAndAccountabilityProps> = ({
  role,
  deposit,
  setDeposit,
  guardianNotifications,
  mentorSubmissions,
  onEvaluateSubmission,
  tabInterruptions,
}) => {
  const [guardianAuthorized, setGuardianAuthorized] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);

  // Mentor evaluation local state
  const [marksDraft, setMarksDraft] = useState<Record<string, string>>({});
  const [remarksDraft, setRemarksDraft] = useState<Record<string, string>>({});

  const isEligible =
    deposit.lecturesCompleted >= deposit.lecturesRequired &&
    deposit.subtopicsMastered >= deposit.subtopicsRequired &&
    deposit.quizzesPassed >= deposit.quizzesRequired &&
    deposit.revisionsCompleted >= deposit.revisionsRequired &&
    deposit.assignmentsSubmitted >= deposit.assignmentsRequired;

  const overallCompletionPct = Math.round(
    ((deposit.lecturesCompleted / deposit.lecturesRequired +
      deposit.subtopicsMastered / deposit.subtopicsRequired +
      deposit.quizzesPassed / deposit.quizzesRequired +
      deposit.revisionsCompleted / deposit.revisionsRequired +
      deposit.assignmentsSubmitted / deposit.assignmentsRequired) /
      5) *
      100
  );

  const handleCompleteRequirementsDemo = () => {
    setDeposit((prev) => ({
      ...prev,
      lecturesCompleted: prev.lecturesRequired,
      subtopicsMastered: prev.subtopicsRequired,
      quizzesPassed: prev.quizzesRequired,
      revisionsCompleted: prev.revisionsRequired,
      assignmentsSubmitted: prev.assignmentsRequired,
      payoutStatus: prev.payoutStatus === 'transferred' ? 'transferred' : 'eligible',
    }));
  };

  const handleInitiatePayout = async () => {
    setPayoutError(null);
    setPayoutLoading(true);
    try {
      const res = await fetch('/api/deposits/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: deposit.id,
          upiOrBankMasked: deposit.upiOrBankMasked,
          amountInr: deposit.refundableDepositInr,
          guardianAuthorized,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayoutError(data.error || 'Could not initiate deposit payout.');
        return;
      }
      setDeposit((prev) => ({
        ...prev,
        payoutStatus: 'transferred',
        transactionId: data.transactionId,
        expectedProcessing: data.expectedProcessing,
      }));
    } catch {
      setPayoutError('Network error initiating escrow transfer.');
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleDownloadCertificate = () => {
    const certId = `MFG-CERT-2026-8492`;
    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>MindForge Certificate - ${certId}</title></head>
<body style="font-family: 'Iowan Old Style', Georgia, serif; padding: 48px; background: #29251d; color: #29251d;">
  <div style="max-width: 720px; margin: 0 auto; background: #f4ecd8; border: 2px solid #8b673c; padding: 40px;">
    <div style="font-size: 12px; letter-spacing: 0.12em; color: #8b673c;">MINDFORGE LEARNING &amp; ACCOUNTABILITY ECOSYSTEM</div>
    <h1 style="margin: 16px 0 8px; font-size: 30px; font-style: italic;">Certificate of Verified Mastery</h1>
    <p style="color: #5e5240; margin: 0 0 24px;">This certifies that</p>
    <div style="font-size: 24px; font-weight: 700; margin-bottom: 12px;">Aarav Sharma</div>
    <p style="line-height: 1.6;">has completed all required micro-lectures, subtopic recall decks, spaced repetition intervals, Sunday Blurting assessments, and mentor evaluations for <strong>${deposit.courseName}</strong>.</p>
    <div style="margin-top: 32px; display: flex; justify-content: space-between; font-size: 13px; color: #5e5240; border-top: 1px solid #c3a47b; padding-top: 16px;">
      <span>Certificate ID: <strong>${certId}</strong></span>
      <span>Issued: Nov 13, 2026</span>
      <span>QR Verify: mindforge.edu/verify/${certId}</span>
    </div>
  </div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MindForge-Certificate-${certId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#dccfb4] dark:border-[#c3a47b]/20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#29251d] dark:text-[#eee2ca]">
            {role === 'parent'
              ? 'Parent & Guardian Accountability Dashboard'
              : role === 'mentor'
              ? 'Human Mentor Evaluation Console'
              : '70% Refundable Deposit, Guardian Sync & Certificates'}
          </h1>
          <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
            Escrow-safeguarded 70% completion deposit, real-time parent study notifications, and verified human mentorship.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-[#5e5240] dark:text-[#c5b79e]">
          Active View: {role.toUpperCase()}
        </span>
      </div>

      {/* SECTION 1: 70% Refundable Completion Deposit Dashboard (shown prominently for Student & Parent) */}
      {(role === 'student' || role === 'parent') && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              <div>
                <div className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                  Safeguarded Escrow Account · {deposit.courseName}
                </div>
                <h2 className="text-lg font-semibold text-[#29251d] dark:text-[#eee2ca] mt-0.5">
                  70% Refundable Completion Deposit Ledger
                </h2>
              </div>
              <span className="text-xs font-mono tabular-nums font-semibold text-[#8b673c] dark:text-[#c3a47b]">
                {overallCompletionPct}% Eligible
              </span>
            </div>

            {/* Transparent Pre-Purchase & Escrow Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20">
                <div className="text-xs text-[#5e5240] dark:text-[#c5b79e]">Total Paid</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#29251d] dark:text-[#eee2ca] mt-1">
                  ₹{deposit.totalPaidInr.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-[#5e5240] dark:text-[#c5b79e] mt-1">100% upfront receipt</div>
              </div>
              <div className="p-4 rounded-lg bg-[#5f684f]/15 dark:bg-[#89946f]/15 border border-[#5f684f]/35 dark:border-[#89946f]/35">
                <div className="text-xs text-[#4f5841] dark:text-[#9aa67e]">70% Refundable Deposit</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#29251d] dark:text-[#eee2ca] mt-1">
                  ₹{deposit.refundableDepositInr.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-[#4f5841] dark:text-[#9aa67e] mt-1">
                  Segregated escrow · Not revenue
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20">
                <div className="text-xs text-[#5e5240] dark:text-[#c5b79e]">30% Platform Fee</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#29251d] dark:text-[#eee2ca] mt-1">
                  ₹{deposit.platformFeeInr.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-[#5e5240] dark:text-[#c5b79e] mt-1">AI &amp; mentor operations</div>
              </div>
            </div>

            {/* Eligibility Conditions Checklist */}
            <div className="space-y-2.5 text-xs">
              <div className="font-semibold text-[#29251d] dark:text-[#eee2ca]">
                Disclosed Eligibility Requirements (Deadline: {deposit.eligibilityWindowEnd})
              </div>
              {[
                ['Mandatory 20-min Lectures', deposit.lecturesCompleted, deposit.lecturesRequired],
                ['Subtopics Mastered (>= 75% quiz)', deposit.subtopicsMastered, deposit.subtopicsRequired],
                ['Concept Check Quizzes Passed', deposit.quizzesPassed, deposit.quizzesRequired],
                ['Spaced Repetition Reviews', deposit.revisionsCompleted, deposit.revisionsRequired],
                ['Sunday & 2-Day Assignments', deposit.assignmentsSubmitted, deposit.assignmentsRequired],
              ].map(([label, done, req]) => {
                const met = Number(done) >= Number(req);
                return (
                  <div key={String(label)} className="flex items-center justify-between py-1.5 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
                    <span className="text-[#29251d] dark:text-[#eee2ca]">{label}</span>
                    <span className={`font-mono tabular-nums font-medium ${met ? 'text-[#5f684f] dark:text-[#89946f]' : 'text-[#5e5240] dark:text-[#c5b79e]'}`}>
                      {done} / {req} {met ? '· Verified' : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Payout Initiation Controls */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5e5240] dark:text-[#c5b79e]">
                <span className="flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b]" />
                  Verified Payout Target: <strong className="text-[#29251d] dark:text-[#eee2ca]">{deposit.upiOrBankMasked}</strong>
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guardianAuthorized}
                    onChange={(e) => setGuardianAuthorized(e.target.checked)}
                    className="accent-[#8b673c] dark:accent-[#c3a47b]"
                  />
                  Guardian payout authorization (Under-18 compliance)
                </label>
              </div>

              {payoutError && (
                <p className="text-xs text-[#945a3e] dark:text-[#d98c6e]">{payoutError}</p>
              )}

              {deposit.payoutStatus === 'transferred' ? (
                <div className="p-4 rounded-lg bg-[#5f684f]/15 dark:bg-[#89946f]/20 border border-[#5f684f]/40 dark:border-[#89946f]/40 text-xs space-y-1 text-[#29251d] dark:text-[#eee2ca]">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5f684f] dark:text-[#89946f]" />
                    ₹{deposit.refundableDepositInr} Direct Bank / UPI Refund Transferred
                  </div>
                  <div className="font-mono">Transaction ID: {deposit.transactionId}</div>
                  <div>{deposit.expectedProcessing}</div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {!isEligible && (
                    <button
                      type="button"
                      onClick={handleCompleteRequirementsDemo}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer"
                    >
                      Verify Remaining Criteria (Hackathon Demo)
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!isEligible || payoutLoading}
                    onClick={handleInitiatePayout}
                    className="px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    {payoutLoading
                      ? 'Initiating Escrow Payout...'
                      : `Initiate ₹${deposit.refundableDepositInr} Bank / UPI Refund`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Digital Certificate with QR Verification */}
          <div className="lg:col-span-5 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b]" />
                <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  Digital Completion Certificate
                </h2>
              </div>
              <span className="text-xs font-mono text-[#5e5240] dark:text-[#c5b79e]">
                {isEligible ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>

            <div className="p-5 rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] space-y-3">
              <div className="text-[11px] font-mono text-[#8b673c] dark:text-[#c3a47b]">
                MINDFORGE VERIFIED CREDENTIAL · ID: MFG-CERT-2026-8492
              </div>
              <div className="text-lg font-bold text-[#29251d] dark:text-[#eee2ca]">
                Aarav Sharma
              </div>
              <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] leading-relaxed">
                {deposit.courseName} — Verified via spaced repetition mastery, Sunday Blurting diagnostics, and mentor evaluation.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-[#e5d9bf] dark:border-[#c3a47b]/15">
                <div className="text-[11px] text-[#5e5240] dark:text-[#c5b79e]">
                  <div>Completed: Nov 13, 2026</div>
                  <div>Status: {isEligible ? 'Ready for PDF / Print' : `${overallCompletionPct}% Progress`}</div>
                </div>
                {/* Deterministic QR Verification SVG */}
                <svg viewBox="0 0 36 36" className="w-12 h-12 bg-[#fbf6ea] p-1 rounded border border-[#c3a47b]" aria-label="QR verification code">
                  <rect x="2" y="2" width="10" height="10" fill="#29251d" />
                  <rect x="4" y="4" width="6" height="6" fill="#fbf6ea" />
                  <rect x="5" y="5" width="4" height="4" fill="#29251d" />
                  <rect x="24" y="2" width="10" height="10" fill="#29251d" />
                  <rect x="26" y="4" width="6" height="6" fill="#fbf6ea" />
                  <rect x="27" y="5" width="4" height="4" fill="#29251d" />
                  <rect x="2" y="24" width="10" height="10" fill="#29251d" />
                  <rect x="4" y="26" width="6" height="6" fill="#fbf6ea" />
                  <rect x="5" y="27" width="4" height="4" fill="#29251d" />
                  <rect x="15" y="6" width="4" height="4" fill="#29251d" />
                  <rect x="16" y="14" width="6" height="6" fill="#29251d" />
                  <rect x="25" y="16" width="5" height="4" fill="#29251d" />
                  <rect x="16" y="25" width="4" height="7" fill="#29251d" />
                  <rect x="24" y="24" width="8" height="8" fill="#29251d" />
                </svg>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadCertificate}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#29251d] hover:bg-[#3a3428] dark:bg-[#c3a47b] dark:text-[#1d1a15] dark:hover:bg-[#dbc39c] rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Printable Certificate
            </button>
          </div>
        </section>
      )}

      {/* SECTION 2: Parental Accountability & Browser Focus Mode Transparency */}
      {(role === 'parent' || role === 'student') && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b]" />
                <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  Real-Time Parent &amp; Guardian Notification Feed
                </h2>
              </div>
              <span className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                Consent Verified · Under-18 Profile
              </span>
            </div>

            <div className="divide-y divide-[#e5d9bf] dark:divide-[#c3a47b]/15 mt-2">
              {guardianNotifications.map((n) => (
                <div key={n.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        n.type === 'early_exit'
                          ? 'text-[#945a3e] dark:text-[#d98c6e]'
                          : n.type === 'session_completed'
                          ? 'text-[#5f684f] dark:text-[#89946f]'
                          : 'text-[#8b673c] dark:text-[#c3a47b]'
                      }`}
                    >
                      {n.title}
                    </span>
                    <span className="text-[#5e5240] dark:text-[#c5b79e] tabular-nums">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#29251d] dark:text-[#eee2ca] leading-relaxed">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              <ShieldCheck className="w-4 h-4 text-[#5f684f] dark:text-[#89946f]" />
              <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                Weekly Consistency &amp; Honest Focus Scope
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20">
                <div className="text-[#5e5240] dark:text-[#c5b79e]">Planned vs Actual (7d)</div>
                <div className="text-lg font-mono font-bold tabular-nums text-[#29251d] dark:text-[#eee2ca] mt-0.5">
                  315 / 345 min
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20">
                <div className="text-[#5e5240] dark:text-[#c5b79e]">Focus Tab Interruptions</div>
                <div className="text-lg font-mono font-bold tabular-nums text-[#29251d] dark:text-[#eee2ca] mt-0.5">
                  {tabInterruptions}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 text-xs text-[#5e5240] dark:text-[#c5b79e] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b] shrink-0 mt-0.5" />
              <span>
                Technical Transparency: As a web application, Focus Mode restricts in-app distractions and logs browser tab switches during assessments. Device-level blocking of external mobile apps requires native iOS/Android OS permissions. App crashes or network drops are never falsely reported as voluntary early exits.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: Human Mentor Dashboard & Honest Availability */}
      <section className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/mentor_portrait_1794597140690.jpg"
              alt="Prof. Arvind Deshmukh"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover"
            />
            <div>
              <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                Human Mentorship &amp; 2-Day Assignment Evaluation
              </h2>
              <p className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                Prof. Arvind Deshmukh · Live Doubt Hours: 5:00 PM – 8:00 PM IST (Currently in scheduled review queue)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['5:30 PM Slot', '6:15 PM Slot'].map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setBookedSlot(slot)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                  bookedSlot === slot
                    ? 'bg-[#5f684f] text-[#fbf6ea] border-[#5f684f] dark:bg-[#89946f] dark:text-[#1d1a15] dark:border-[#89946f]'
                    : 'border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025]'
                }`}
              >
                {bookedSlot === slot ? `Booked: ${slot}` : `Book ${slot}`}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#e5d9bf] dark:divide-[#c3a47b]/15 mt-3">
          {mentorSubmissions.map((sub) => (
            <div key={sub.id} className="py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-7 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-[#5e5240] dark:text-[#c5b79e]">
                  <UserCheck className="w-3.5 h-3.5 text-[#8b673c] dark:text-[#c3a47b]" />
                  <span className="font-semibold text-[#29251d] dark:text-[#eee2ca]">{sub.studentName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{sub.type}</span>
                  <span aria-hidden="true">·</span>
                  <span>{sub.submittedAt}</span>
                </div>
                <div className="text-sm font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  {sub.topicTitle}
                </div>
                <p className="text-[#29251d] dark:text-[#eee2ca] leading-relaxed bg-[#f4ecd8] dark:bg-[#1d1a15] p-3 rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/20">
                  {sub.responseText}
                </p>
                <div className="text-[#5e5240] dark:text-[#c5b79e]">
                  <strong className="text-[#29251d] dark:text-[#eee2ca]">AI Pre-Assessment ({sub.aiSuggestedScore}/100): </strong>
                  {sub.aiFeedback}
                </div>
              </div>

              <div className="lg:col-span-5 text-xs space-y-2.5 bg-[#f4ecd8] dark:bg-[#1d1a15] p-4 rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/20">
                {sub.status === 'evaluated' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#5f684f] dark:text-[#89946f]">
                        Mentor Verified Score
                      </span>
                      <span className="font-mono text-base font-bold tabular-nums text-[#29251d] dark:text-[#eee2ca]">
                        {sub.mentorMarks} / 100
                      </span>
                    </div>
                    <p className="text-[#5e5240] dark:text-[#c5b79e]">{sub.mentorRemarks}</p>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-[#29251d] dark:text-[#eee2ca]">
                      Mentor Override &amp; Remarks
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder={String(sub.aiSuggestedScore)}
                        value={marksDraft[sub.id] ?? ''}
                        onChange={(e) =>
                          setMarksDraft((p) => ({ ...p, [sub.id]: e.target.value }))
                        }
                        className="w-24 px-2.5 py-1.5 rounded border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] text-[#29251d] dark:text-[#eee2ca] font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Add personalized mentor feedback..."
                        value={remarksDraft[sub.id] ?? ''}
                        onChange={(e) =>
                          setRemarksDraft((p) => ({ ...p, [sub.id]: e.target.value }))
                        }
                        className="flex-1 px-2.5 py-1.5 rounded border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] text-[#29251d] dark:text-[#eee2ca]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onEvaluateSubmission(
                          sub.id,
                          Number(marksDraft[sub.id] || sub.aiSuggestedScore),
                          remarksDraft[sub.id] ||
                            'Reviewed AI grading; derivation steps verified. Keep revising Mass Action Law.'
                        )
                      }
                      className="px-3.5 py-1.5 font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-md cursor-pointer"
                    >
                      Approve &amp; Send Feedback
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
