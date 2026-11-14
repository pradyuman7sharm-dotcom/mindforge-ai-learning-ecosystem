import type {
  DepositCourseLedger,
  Flashcard,
  GuardianNotification,
  LectureItem,
  MentorSubmission,
  QuizQuestion,
  RevisionItem,
  SkillNode,
  SubtopicItem,
  TimestampNote,
} from '../types/mindforge';

export const INITIAL_SUBTOPICS: SubtopicItem[] = [
  {
    id: 'sub-1',
    topicId: 'semiconductor-physics',
    title: 'Introduction to Semiconductors & Energy Bands',
    durationMinutes: 16,
    completed: true,
    masteryScore: 88,
    lastPracticed: 'Yesterday',
  },
  {
    id: 'sub-2',
    topicId: 'semiconductor-physics',
    title: 'Intrinsic Semiconductors (Thermal Carrier Generation)',
    durationMinutes: 18,
    completed: true,
    masteryScore: 76,
    lastPracticed: 'Yesterday',
  },
  {
    id: 'sub-3',
    topicId: 'semiconductor-physics',
    title: 'Extrinsic Semiconductors & Doping Concentration',
    durationMinutes: 15,
    completed: false,
    masteryScore: 42,
  },
  {
    id: 'sub-4',
    topicId: 'semiconductor-physics',
    title: 'P-Type Semiconductors (Acceptor Levels & Holes)',
    durationMinutes: 14,
    completed: false,
    masteryScore: 0,
  },
  {
    id: 'sub-5',
    topicId: 'semiconductor-physics',
    title: 'N-Type Semiconductors (Donor Levels & Majority Carriers)',
    durationMinutes: 14,
    completed: false,
    masteryScore: 0,
  },
  {
    id: 'sub-6',
    topicId: 'semiconductor-physics',
    title: 'PN Junction Diode & Depletion Layer Potential',
    durationMinutes: 19,
    completed: false,
    masteryScore: 0,
  },
];

export const LECTURE_CATALOG: LectureItem[] = [
  {
    id: 'lec-semi-1',
    subject: 'Physics',
    topicId: 'semiconductor-physics',
    topicTitle: 'Semiconductor Physics',
    subtopicTitle: 'PN Junction Diode & Depletion Region',
    instructor: 'Prof. Arvind Deshmukh',
    durationMinutes: 18,
    level: 'Intermediate',
    thumbnail: '/src/assets/images/lecture_semiconductor_thumb_1794597140633.jpg',
    resumeSeconds: 275,
    highlights: [
      {
        timeLabel: '02:15',
        seconds: 135,
        tag: 'Definition',
        text: 'Depletion region contains immobile uncovered donor and acceptor ions, not free charge carriers.',
      },
      {
        timeLabel: '04:35',
        seconds: 275,
        tag: 'Formula',
        text: 'Mass Action Law at thermal equilibrium: n_e · n_h = n_i^2 holds for both intrinsic and doped crystals.',
      },
      {
        timeLabel: '09:40',
        seconds: 580,
        tag: 'Exam Trap',
        text: 'Forward bias reduces barrier potential V_b - V, whereas reverse bias widens the depletion width.',
      },
      {
        timeLabel: '14:20',
        seconds: 860,
        tag: 'High-Yield',
        text: 'Knee voltage is ~0.7 V for Silicon and ~0.3 V for Germanium at room temperature (300 K).',
      },
    ],
    transcript: [
      {
        seconds: 45,
        timeLabel: '00:45',
        speaker: 'Prof. Deshmukh',
        line: 'When a P-type crystal and N-type crystal are metallurgically joined, concentration gradients immediately trigger diffusion.',
      },
      {
        seconds: 135,
        timeLabel: '02:15',
        speaker: 'Prof. Deshmukh',
        line: 'Holes diffuse from P to N and electrons from N to P, leaving behind fixed ionized acceptor and donor cores.',
      },
      {
        seconds: 275,
        timeLabel: '04:35',
        speaker: 'Prof. Deshmukh',
        line: 'Notice that at thermal equilibrium, drift current equals diffusion current, and n_e times n_h remains equal to n_i squared.',
      },
      {
        seconds: 580,
        timeLabel: '09:40',
        speaker: 'Prof. Deshmukh',
        line: 'Be careful of the classic JEE/NEET trap: an unbiased PN junction has a net built-in electric field from N to P, yet zero net external current.',
      },
    ],
    explanations: {
      Beginner: {
        summary:
          'Think of a PN junction like two crowded rooms separated by a doorway: extra electrons on the N-side wander to the P-side until an electric wall builds up and stops further crossing.',
        keyFormula: 'I_net = I_diffusion - I_drift = 0 (at equilibrium)',
        derivationNote:
          'Diffusion pushes majority carriers across the junction; the resulting fixed ions create an internal barrier that pulls minority carriers back.',
        realWorldApp: 'Used in smartphone charger rectifiers to convert AC wall power into steady DC.',
      },
      Intermediate: {
        summary:
          'Concentration gradients drive diffusion current across the metallurgical junction, creating a space-charge depletion region of immobile ions that establishes a built-in potential V_0 (~0.7 V in Si).',
        keyFormula: 'n_e · n_h = n_i^2   and   V_effective = V_0 - V_applied (Forward)',
        derivationNote:
          'Under forward bias, the applied electric field opposes the built-in barrier field, lowering potential energy barrier height by qV and increasing majority carrier injection exponentially.',
        realWorldApp: 'LEDs emit photons when injected electrons recombine across a direct-bandgap PN junction.',
      },
      Advanced: {
        summary:
          'Solving Poisson’s equation across the abrupt junction yields parabolic band bending and depletion width W proportional to sqrt((V_0 - V)(N_A + N_D)/(N_A N_D)).',
        keyFormula: 'I = I_0 (exp(qV / η k_B T) - 1)',
        derivationNote:
          'Derived from Shockley’s boundary condition on excess minority carrier density Δp_n(0) = p_n0 (exp(qV/k_BT) - 1) and steady-state continuity equation.',
        realWorldApp: 'Solar cells operate in the 4th quadrant of the Shockley I-V curve under reverse-bias photocurrent.',
      },
    },
    formulasForWhy: [
      {
        id: 'why-mass-action',
        expression: 'n_e · n_h = n_i²',
        name: 'Mass Action Law in Semiconductors',
        origin: 'Statistical Fermi-Dirac mechanics in thermal equilibrium (300 K)',
        principles: [
          'Thermal generation rate G depends only on temperature T and bandgap E_g.',
          'Recombination rate R is proportional to the product of available electrons and holes: R = α · n_e · n_h.',
          'At steady-state equilibrium, G = R, forcing n_e · n_h to equal the intrinsic value n_i².',
        ],
        assumptions: [
          'Non-degenerate doping (Fermi level stays away from band edges by > 3 k_B T).',
          'Uniform temperature and zero external illumination or bias injection.',
        ],
        limitations: [
          'Breaks down under heavy degenerate doping or high-level optical/forward injection.',
        ],
        application: 'Calculates minority carrier concentration immediately once donor doping N_d is known: n_h ≈ n_i² / N_d.',
      },
      {
        id: 'why-shockley',
        expression: 'I = I₀ (e^(qV / ηkT) − 1)',
        name: 'Shockley Ideal Diode Equation',
        origin: 'Boltzmann barrier injection & minority carrier diffusion continuity',
        principles: [
          'Lowering the barrier by qV increases minority carriers crossing the edge exponentially via Boltzmann factor.',
          'Excess minority carriers diffuse away and recombine over diffusion length L_p, L_n.',
        ],
        assumptions: [
          'Negligible series bulk resistance and negligible generation-recombination inside the depletion region.',
        ],
        limitations: [
          'Fails at very high forward currents (series resistance dominates) and Zener/avalanche breakdown.',
        ],
        application: 'Predicts dynamic resistance r_d = ηV_T / I for small-signal diode circuits.',
      },
    ],
  },
  {
    id: 'lec-mech-1',
    subject: 'Physics',
    topicId: 'rotational-mechanics',
    topicTitle: 'Motion & Projectile Kinematics',
    subtopicTitle: '2D Trajectory, Range & Angle Optimization',
    instructor: 'Dr. Meera Iyer',
    durationMinutes: 19,
    level: 'Intermediate',
    thumbnail: '/src/assets/images/lecture_mechanics_thumb_1794597139953.jpg',
    resumeSeconds: 0,
    highlights: [
      {
        timeLabel: '03:10',
        seconds: 190,
        tag: 'Formula',
        text: 'Horizontal range R = (u² sin 2θ) / g achieves maximum at θ = 45° on level ground.',
      },
      {
        timeLabel: '08:50',
        seconds: 530,
        tag: 'Exam Trap',
        text: 'At the highest point, velocity is NOT zero—horizontal component u cos θ remains intact.',
      },
    ],
    transcript: [
      {
        seconds: 30,
        timeLabel: '00:30',
        speaker: 'Dr. Iyer',
        line: 'Superposition lets us split oblique projectile motion into uniform horizontal motion and uniformly accelerated vertical motion.',
      },
      {
        seconds: 190,
        timeLabel: '03:10',
        speaker: 'Dr. Iyer',
        line: 'Complementary angles θ and 90° - θ yield the exact same horizontal range R, though different flight times and peak heights.',
      },
    ],
    explanations: {
      Beginner: {
        summary: 'Horizontal speed stays constant while gravity only pulls downward, tracing a symmetric parabola.',
        keyFormula: 'R = (u² sin 2θ) / g',
        derivationNote: 'Multiply constant horizontal velocity u cos θ by total air time 2u sin θ / g.',
        realWorldApp: 'Estimating optimal launch angles in athletics and water-jet trajectories.',
      },
      Intermediate: {
        summary: 'Decoupling x and y axes under constant g removes time t to reveal the quadratic trajectory y = x tan θ - gx²/(2u² cos² θ).',
        keyFormula: 'H_max = (u² sin² θ) / (2g)',
        derivationNote: 'Set vertical velocity v_y = 0 at peak height and use v_y² = u_y² - 2gH.',
        realWorldApp: 'Ballistic trajectory correction when firing from elevated cliffs.',
      },
      Advanced: {
        summary: 'On an inclined plane of angle β, decomposing g into parallel (g sin β) and perpendicular (g cos β) components generalizes range optimization to θ_opt = π/4 + β/2.',
        keyFormula: 'R_incline = [2u² sin(α - β) cos α] / (g cos² β)',
        derivationNote: 'Time of flight depends strictly on acceleration normal to the incline.',
        realWorldApp: 'Aerospace re-entry glide range envelope modeling.',
      },
    },
    formulasForWhy: [
      {
        id: 'why-range',
        expression: 'R = u² sin(2θ) / g',
        name: 'Horizontal Projectile Range',
        origin: 'Independence of perpendicular velocity components (Galileo)',
        principles: [
          'Gravity acts solely along -ŷ, so a_x = 0.',
          'Time of flight T = 2u sin θ / g is governed purely by vertical return to y = 0.',
          'Range R = (u cos θ) · T = u² (2 sin θ cos θ) / g.',
        ],
        assumptions: ['Flat horizontal terrain, uniform g, zero aerodynamic drag or Coriolis force.'],
        limitations: ['Invalid when launch and landing altitudes differ or air resistance is non-negligible.'],
        application: 'Used to show that θ = 30° and θ = 60° land at identical horizontal distances.',
      },
    ],
  },
];

export const INITIAL_NOTES: TimestampNote[] = [
  {
    id: 'note-1',
    lectureId: 'lec-semi-1',
    timestampSeconds: 275,
    timestampLabel: '04:35',
    type: 'written',
    content: 'Key distinction: Drift current is driven by built-in E-field (minority carriers); diffusion is driven by concentration gradient (majority carriers).',
    createdAt: 'Today · 10:14 AM',
  },
  {
    id: 'note-2',
    lectureId: 'lec-semi-1',
    timestampSeconds: 580,
    timestampLabel: '09:40',
    type: 'voice',
    content: 'Voice memo: Remember knee voltage is 0.7V for Si and 0.3V for Ge; reverse bias resistance is in megaohms.',
    durationLabel: '0:24',
    createdAt: 'Yesterday · 06:42 PM',
  },
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    subtopicTitle: 'PN Junction Diode',
    category: 'Concept',
    front: 'What makes up the depletion region in an unbiased PN junction?',
    back: 'Immobile uncovered acceptor ions (negative on P-side) and donor ions (positive on N-side)—free mobile carriers are swept out.',
  },
  {
    id: 'fc-2',
    subtopicTitle: 'Intrinsic & Extrinsic Semiconductors',
    category: 'Formula',
    front: 'State the Mass Action Law and what it predicts for minority carriers.',
    back: 'n_e · n_h = n_i². In an N-type crystal with donor density N_d, minority hole density becomes n_h ≈ n_i² / N_d.',
  },
  {
    id: 'fc-3',
    subtopicTitle: 'PN Junction Biasing',
    category: 'Trap',
    front: 'Exam Trap: Does an unbiased PN junction produce current if you connect its leads with a copper wire?',
    back: 'No. Built-in contact potentials at the metal-semiconductor junctions cancel out the PN barrier potential in a closed isothermal loop.',
  },
];

export const INITIAL_QUIZ: QuizQuestion[] = [
  {
    id: 'q-1',
    question: 'When a silicon PN junction is forward biased with 0.4 V, what happens to the depletion layer width?',
    options: [
      'It widens because electrons are pulled toward the battery.',
      'It narrows because the applied field opposes the built-in barrier field.',
      'It remains constant until 0.7 V is exceeded.',
      'It drops immediately to zero width.',
    ],
    correctIndex: 1,
    explanation: 'Any forward bias lowers the net barrier potential (V_0 - V), reducing the space-charge width continuously even below the knee voltage.',
    conceptTag: 'Depletion Width',
  },
  {
    id: 'q-2',
    question: 'Pure Silicon has n_i = 1.5 × 10^16 m^-3. If doped with 5 × 10^22 m^-3 Phosphorus atoms, what is the approximate hole concentration?',
    options: [
      '4.5 × 10^9 m^-3',
      '3.0 × 10^6 m^-3',
      '1.5 × 10^16 m^-3',
      '5.0 × 10^22 m^-3',
    ],
    correctIndex: 0,
    explanation: 'By Mass Action Law: n_h = n_i² / n_e = (2.25 × 10^32) / (5 × 10^22) = 4.5 × 10^9 m^-3.',
    conceptTag: 'Mass Action Law',
  },
];

export const INITIAL_REVISIONS: RevisionItem[] = [
  {
    id: 'rev-1',
    topicTitle: 'Semiconductor Physics',
    subtopicTitle: 'Intrinsic Carrier Concentration & Bandgap',
    intervalStage: '1-Day',
    status: 'today',
    dueLabel: 'Due Today',
    accuracyRate: 76,
    promptQuestion: 'Explain without notes why pure Silicon conductivity rises sharply with temperature, unlike Copper.',
    modelAnswer: 'In Silicon, thermal energy breaks covalent bonds to increase carrier density n_i exponentially (n_i ∝ T^(3/2) e^(-Eg/2kT)), overpowering mobility drop; in Copper, n is fixed and phonon scattering reduces conductivity.',
  },
  {
    id: 'rev-2',
    topicTitle: 'Electrostatics',
    subtopicTitle: 'Gauss Law & Conducting Shells',
    intervalStage: '3-Day',
    status: 'today',
    dueLabel: 'Due Today',
    accuracyRate: 84,
    promptQuestion: 'What is the electric field inside a hollow uniformly charged spherical shell, and why?',
    modelAnswer: 'Zero everywhere inside the cavity because any concentric Gaussian sphere encloses Q_enc = 0 and spherical symmetry forces E = 0.',
  },
  {
    id: 'rev-3',
    topicTitle: 'Chemical Kinetics',
    subtopicTitle: 'First-Order Half-Life Derivation',
    intervalStage: '7-Day',
    status: 'upcoming',
    dueLabel: 'In 2 Days',
    accuracyRate: 91,
    promptQuestion: 'Show why t_1/2 = ln(2)/k is independent of initial concentration [A]_0 for a first-order reaction.',
    modelAnswer: 'From ln([A]_0/[A]) = kt, substituting [A] = [A]_0/2 cancels [A]_0 immediately, leaving t_1/2 = 0.693/k.',
  },
  {
    id: 'rev-4',
    topicTitle: 'Optics',
    subtopicTitle: 'Prism Minimum Deviation Condition',
    intervalStage: '1-Day',
    status: 'missed',
    dueLabel: 'Missed Yesterday',
    accuracyRate: 54,
    promptQuestion: 'At minimum deviation δ_m, how do angle of incidence i and emergence e relate inside a symmetric prism?',
    modelAnswer: 'i = e and r_1 = r_2 = A/2, making the internal refracted ray parallel to the prism base.',
  },
];

export const INITIAL_SKILL_TREE: SkillNode[] = [
  { id: 'sk-1', subject: 'Physics', title: 'Basic Mechanics & Vectors', prerequisiteIds: [], status: 'completed', masteryPercent: 94, tier: 1 },
  { id: 'sk-2', subject: 'Physics', title: '1D & Projectile Motion', prerequisiteIds: ['sk-1'], status: 'completed', masteryPercent: 86, tier: 2 },
  { id: 'sk-3', subject: 'Physics', title: 'Laws of Motion & Friction', prerequisiteIds: ['sk-2'], status: 'unlocked', masteryPercent: 68, tier: 3 },
  { id: 'sk-4', subject: 'Physics', title: 'Work, Energy & Power', prerequisiteIds: ['sk-3'], status: 'locked', masteryPercent: 0, tier: 4 },
  { id: 'sk-5', subject: 'Physics', title: 'Rotational Mechanics', prerequisiteIds: ['sk-4'], status: 'locked', masteryPercent: 0, tier: 5 },
];

export const INITIAL_GUARDIAN_NOTIFICATIONS: GuardianNotification[] = [
  {
    id: 'gn-1',
    type: 'session_completed',
    title: 'Planned 45-minute study session completed',
    message: 'Aarav completed "Intrinsic Semiconductors & Energy Bands" (45/45 min · 88% quiz accuracy).',
    timestamp: 'Yesterday · 07:45 PM',
    plannedMinutes: 45,
    actualMinutes: 45,
    remainingMinutes: 0,
  },
  {
    id: 'gn-2',
    type: 'early_exit',
    title: 'Early exit reported by student',
    message: 'Aarav ended a 60-minute session after 38 minutes. Remaining planned time: 22 minutes.',
    timestamp: 'Nov 11 · 06:38 PM',
    plannedMinutes: 60,
    actualMinutes: 38,
    remainingMinutes: 22,
  },
];

export const INITIAL_DEPOSIT_LEDGER: DepositCourseLedger = {
  id: 'dep-jee-physics',
  courseName: 'Arjuna Physics Mastery Cohort (JEE / Class 12)',
  totalPaidInr: 1000,
  refundableDepositInr: 700,
  platformFeeInr: 300,
  lecturesCompleted: 14,
  lecturesRequired: 18,
  subtopicsMastered: 21,
  subtopicsRequired: 24,
  quizzesPassed: 16,
  quizzesRequired: 20,
  revisionsCompleted: 9,
  revisionsRequired: 12,
  assignmentsSubmitted: 4,
  assignmentsRequired: 5,
  eligibilityWindowEnd: 'Dec 20, 2026',
  payoutStatus: 'in_progress',
  upiOrBankMasked: 'HDFC •••• 4821 (aarav.guardian@okhdfcbank)',
};

export const INITIAL_MENTOR_SUBMISSIONS: MentorSubmission[] = [
  {
    id: 'ms-1',
    studentName: 'Aarav Sharma (Class 12 · Minor)',
    topicTitle: 'Semiconductor Physics — 2-Day Recall',
    submittedAt: 'Today · 09:20 AM',
    type: '2-Day Recall',
    responseText:
      'In a PN junction, electrons diffuse from N to P and holes from P to N leaving immobile ions that create an internal electric field from N to P. Under forward bias, barrier height decreases from V0 to V0 - V.',
    aiSuggestedScore: 86,
    aiFeedback:
      'Accurate core mechanism of diffusion vs drift equilibrium. Missing quantitative mention of knee voltage (~0.7V Si) and Mass Action Law n_e·n_h = n_i².',
    status: 'pending',
  },
  {
    id: 'ms-2',
    studentName: 'Ananya Verma (JEE Dropper)',
    topicTitle: 'Projectile Kinematics — Handwritten Derivation',
    submittedAt: 'Yesterday · 08:05 PM',
    type: 'Handwritten Upload',
    responseText:
      'Derived trajectory equation y = x tan θ - gx² / (2u² cos² θ) and verified complementary angle equality R(θ) = R(90° - θ).',
    aiSuggestedScore: 92,
    aiFeedback: 'Clean derivation steps and accurate algebraic substitution.',
    mentorMarks: 94,
    mentorRemarks: 'Excellent step clarity. Next, try deriving maximum range on a 30° inclined plane.',
    status: 'evaluated',
  },
];

export const CONCEPT_REELS_DATA = [
  {
    id: 'reel-1',
    title: 'Why Prism Dispersion Separates Violet More Than Red',
    subject: 'Physics · Ray Optics',
    durationSec: 52,
    weakTopicMatch: true,
    linkedLectureId: 'lec-semi-1',
    visual: '/src/assets/images/reel_physics_experiment_1794597141411.jpg',
    keyTakeaway: 'Cauchy’s formula n = A + B/λ² means shorter wavelength (violet) sees higher refractive index n, bending more strongly.',
    examTrap: 'In vacuum, all wavelengths travel at c; dispersion only occurs inside dispersive media.',
    likes: 1240,
  },
  {
    id: 'reel-2',
    title: '30-Second Trick: Majority vs Minority Carriers Under Doping',
    subject: 'Physics · Semiconductors',
    durationSec: 46,
    weakTopicMatch: true,
    linkedLectureId: 'lec-semi-1',
    visual: '/src/assets/images/lecture_semiconductor_thumb_1794597140633.jpg',
    keyTakeaway: 'Adding 1 donor atom per 10⁶ Silicon atoms boosts majority electrons by 10⁶× while suppressing holes by 10⁶× via n_e·n_h = n_i².',
    examTrap: 'An N-type semiconductor crystal as a whole is electrically NEUTRAL, not negatively charged.',
    likes: 980,
  },
  {
    id: 'reel-3',
    title: 'Why 45° Is NOT Optimal From a Cliff',
    subject: 'Physics · Kinematics',
    durationSec: 58,
    weakTopicMatch: false,
    linkedLectureId: 'lec-mech-1',
    visual: '/src/assets/images/lecture_mechanics_thumb_1794597139953.jpg',
    keyTakeaway: 'Launching from height h > 0 favors angles slightly below 45° because extra drop height already provides extra hang time.',
    examTrap: 'R = u² sin(2θ)/g only holds when landing elevation equals launch elevation.',
    likes: 815,
  },
];

export const STORIES_DATA = [
  {
    id: 'st-1',
    creator: 'Prof. Arvind Deshmukh',
    role: 'Physics Faculty',
    avatar: '/src/assets/images/mentor_portrait_1794597140690.jpg',
    expiresIn: '18h left',
    type: 'Rapid Poll',
    question: 'Is an N-type Silicon crystal positively charged, negatively charged, or neutral?',
    options: ['Negatively charged', 'Electrically neutral', 'Positively charged'],
    correctIdx: 1,
    tip: 'Every Phosphorus atom brings 5 valence electrons AND 15 protons—net crystal charge remains zero.',
  },
  {
    id: 'st-2',
    creator: 'MindForge AI Mentor',
    role: 'Daily Spaced Recall',
    avatar: '/src/assets/images/lecture_semiconductor_thumb_1794597140633.jpg',
    expiresIn: '11h left',
    type: 'Mini Challenge',
    question: 'If forward bias doubles across an ideal diode, does current double?',
    options: ['Yes, Ohm’s Law applies', 'No, current grows exponentially'],
    correctIdx: 1,
    tip: 'Shockley equation I ∝ exp(qV/ηkT) means a tiny 60 mV rise increases current by ~10×.',
  },
];

export const PODCAST_EPISODES = [
  {
    id: 'pod-1',
    title: 'NCERT Audio Story: How Bardeen & Brattain Invented the Transistor',
    duration: '08:40',
    category: 'NCERT Storytelling',
    scriptSummary: 'Walks through Bell Labs 1947 point-contact experiments, carrier injection, and how doped Silicon replaced bulky vacuum tubes.',
  },
  {
    id: 'pod-2',
    title: 'Commute Mnemonics: All 12 Semiconductor & Diode Formulas in 5 Minutes',
    duration: '05:15',
    category: 'Formula Mnemonics',
    scriptSummary: 'Rapid active-recall audio prompts with 3-second pause gaps so you can recite Mass Action Law, Barrier Potential, and Rectifier Efficiency.',
  },
];

export const TRAP_PUZZLES = [
  {
    id: 'trap-1',
    title: 'Find the Broken Step: Charge of an Extrinsic Crystal',
    steps: [
      'Step 1: Take a pure neutral Silicon crystal (n_e = n_h = n_i).',
      'Step 2: Dope it with pentavalent Phosphorus atoms (5 valence electrons).',
      'Step 3: Each Phosphorus donates 1 free electron to the conduction band, increasing n_e.',
      'Step 4: Because free electrons now vastly outnumber holes (n_e >> n_h), the crystal acquires a net negative charge.',
    ],
    bugStepIndex: 3,
    explanation:
      'Step 4 is the classic misconception! Each Phosphorus atom also adds an extra positive nuclear proton (+15 vs Silicon +14). When it donates an electron, it becomes a fixed +1 donor ion—so total positive charge still equals total negative charge (zero net charge).',
  },
  {
    id: 'trap-2',
    title: 'Find the Broken Step: Projectile Peak Velocity',
    steps: [
      'Step 1: Launch a ball at speed u and angle θ above horizontal.',
      'Step 2: Decompose initial velocity into u_x = u cos θ and u_y = u sin θ.',
      'Step 3: At maximum height H_max, vertical velocity v_y becomes 0, so total kinetic energy becomes 0.',
      'Step 4: Equate initial kinetic energy to m g H_max to solve for H_max.',
    ],
    bugStepIndex: 2,
    explanation:
      'Step 3 fails because u_x = u cos θ stays constant throughout flight! Total kinetic energy at the peak is ½ m (u cos θ)², not zero.',
  },
];
