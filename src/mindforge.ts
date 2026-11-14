export type UserRole = 'student' | 'parent' | 'mentor';

export type ExamTrack = 'jee' | 'neet' | 'upsc';

export type ExplanationLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type WorkspaceSection =
  | 'hub'
  | 'lectures'
  | 'knowledge'
  | 'recall'
  | 'arena'
  | 'deposit';

export interface ScheduleBlock {
  id: string;
  title: string;
  subtopic: string;
  activityType: 'lecture' | 'recall' | 'quiz' | 'revision' | 'break';
  durationMinutes: number;
  completed: boolean;
  lectureId?: string;
}

export interface SubtopicItem {
  id: string;
  topicId: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
  masteryScore: number; // 0-100, updated from quiz/flashcards, NOT checkbox alone
  lastPracticed?: string;
}

export interface TimestampNote {
  id: string;
  lectureId: string;
  timestampSeconds: number;
  timestampLabel: string;
  type: 'written' | 'voice';
  content: string;
  durationLabel?: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  subtopicTitle: string;
  category: 'Definition' | 'Formula' | 'Concept' | 'Trap';
  front: string;
  back: string;
  confidence?: 'hard' | 'good' | 'easy';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  conceptTag: string;
}

export interface RevisionItem {
  id: string;
  topicTitle: string;
  subtopicTitle: string;
  intervalStage: '1-Day' | '3-Day' | '7-Day' | '14-Day';
  status: 'today' | 'upcoming' | 'completed' | 'missed';
  dueLabel: string;
  accuracyRate: number;
  promptQuestion: string;
  modelAnswer: string;
}

export interface BlurtingEvaluation {
  accuracyScore: number;
  completenessScore: number;
  clarityScore: number;
  coveredConcepts: string[];
  missingConcepts: string[];
  conceptConnections: string;
  improvementPlan: string[];
}

export interface GuardianNotification {
  id: string;
  type: 'session_started' | 'session_completed' | 'early_exit' | 'weekly_summary';
  title: string;
  message: string;
  timestamp: string;
  plannedMinutes?: number;
  actualMinutes?: number;
  remainingMinutes?: number;
}

export interface StudySessionState {
  id: string | null;
  active: boolean;
  topicTitle: string;
  plannedMinutes: number;
  startedAtIso: string | null;
  expectedEndLabel: string | null;
  elapsedSeconds: number;
  focusModeEnabled: boolean;
  tabInterruptions: number;
}

export interface DepositCourseLedger {
  id: string;
  courseName: string;
  totalPaidInr: number;
  refundableDepositInr: number; // 70%
  platformFeeInr: number; // 30%
  lecturesCompleted: number;
  lecturesRequired: number;
  subtopicsMastered: number;
  subtopicsRequired: number;
  quizzesPassed: number;
  quizzesRequired: number;
  revisionsCompleted: number;
  revisionsRequired: number;
  assignmentsSubmitted: number;
  assignmentsRequired: number;
  eligibilityWindowEnd: string;
  payoutStatus: 'in_progress' | 'eligible' | 'guardian_verified' | 'transferred';
  upiOrBankMasked: string;
  transactionId?: string;
  expectedProcessing?: string;
}

export interface MentorSubmission {
  id: string;
  studentName: string;
  topicTitle: string;
  submittedAt: string;
  type: '2-Day Recall' | 'Sunday Blurting' | 'Handwritten Upload';
  responseText: string;
  aiSuggestedScore: number;
  aiFeedback: string;
  mentorMarks?: number;
  mentorRemarks?: string;
  status: 'pending' | 'evaluated';
}

export interface LectureItem {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  topicId: string;
  topicTitle: string;
  subtopicTitle: string;
  instructor: string;
  durationMinutes: number; // Strictly <= 20
  level: ExplanationLevel;
  thumbnail: string;
  resumeSeconds: number;
  highlights: Array<{
    timeLabel: string;
    seconds: number;
    tag: 'Formula' | 'Exam Trap' | 'Definition' | 'High-Yield';
    text: string;
  }>;
  transcript: Array<{
    seconds: number;
    timeLabel: string;
    speaker: string;
    line: string;
  }>;
  explanations: Record<ExplanationLevel, {
    summary: string;
    keyFormula: string;
    derivationNote: string;
    realWorldApp: string;
  }>;
  formulasForWhy: Array<{
    id: string;
    expression: string;
    name: string;
    origin: string;
    principles: string[];
    assumptions: string[];
    limitations: string[];
    application: string;
  }>;
}

export interface SkillNode {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  title: string;
  prerequisiteIds: string[];
  status: 'completed' | 'unlocked' | 'locked';
  masteryPercent: number;
  tier: number;
}
