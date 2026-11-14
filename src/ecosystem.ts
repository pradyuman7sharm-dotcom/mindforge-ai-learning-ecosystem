import type { ExamTrack } from '../types/mindforge';

export interface EducatorChapter {
  label: string;
  sec: number;
}

export interface EducatorVideo {
  id: string;
  teacher: string;
  title: string;
  duration: string;
  chapters: EducatorChapter[];
  notes: string;
}

export interface PyqItem {
  year: string;
  q: string;
  opts: string[];
  ans: number;
  explain: string;
}

export interface TrackFlashcard {
  q: string;
  a: string;
}

export interface TrackSyllabusItem {
  id: string;
  title: string;
  defaultDone: boolean;
}

export interface ExamTrackConfig {
  id: ExamTrack;
  shortLabel: string;
  badge: string;
  heroTag: string;
  heroTitle: string;
  heroSubtitle: string;
  parentLabel: string;
  mentorSample: string;
  videos: EducatorVideo[];
  quickWikiTopics: string[];
  pyqs: PyqItem[];
  flashcards: TrackFlashcard[];
  syllabus: TrackSyllabusItem[];
}

export interface LearningPlatform {
  name: string;
  cat: 'govt' | 'jeeneet' | 'upsc';
  tag: string;
  desc: string;
  url: string;
}

export interface WikiFallbackEntry {
  title: string;
  description: string;
  extract: string;
  url: string;
}

export const TRACK_CONFIG: Record<ExamTrack, ExamTrackConfig> = {
  jee: {
    id: 'jee',
    shortLabel: 'JEE',
    badge: 'JEE TRACK',
    heroTag: 'NTA JEE Main + Advanced',
    heroTitle: 'JEE Masterclass: Real Teacher Video & Study Whiteboard',
    heroSubtitle:
      'Watch verified lectures from Alakh Pandey (Physics Wallah) & Ashish Arora (Physics Galaxy), jump to chapters, and sketch derivations live.',
    parentLabel: 'JEE (Main + Advanced)',
    mentorSample:
      'In an unbiased p-n junction, majority holes from P diffuse into N and electrons from N diffuse into P, forming a space-charge depletion layer with a ~0.7V barrier potential in Silicon.',
    videos: [
      {
        id: 'hccEUqoviH8',
        teacher: 'Alakh Pandey • Physics Wallah',
        title: 'Semiconductors 01: Introduction, Energy Bands & Intrinsic Carriers',
        duration: '1h 12m',
        chapters: [
          { label: '00:00 Classification of Solids', sec: 0 },
          { label: '18:40 Energy Band Theory', sec: 1120 },
          { label: '39:15 Intrinsic vs Extrinsic', sec: 2355 },
          { label: '55:00 Mass Action Law (nₑ·nₕ = nᵢ²)', sec: 3300 },
        ],
        notes:
          'Key JEE Takeaways: 1) At 0 K, a pure semiconductor behaves as a perfect insulator. 2) Mass Action Law: nₑ × nₕ = nᵢ² holds in thermal equilibrium regardless of doping. 3) Mobility of electrons μₑ > mobility of holes μₕ.',
      },
      {
        id: 'DXBySAmNKJo',
        teacher: 'Ashish Arora • Physics Galaxy',
        title: 'Rigid Body Dynamics #1: Rotational Motion & Moment of Inertia',
        duration: '24m',
        chapters: [
          { label: '00:00 Rigid Body Kinematics', sec: 0 },
          { label: '08:20 Angular Velocity Vector', sec: 500 },
          { label: '16:45 Pure Rolling Condition', sec: 1005 },
        ],
        notes:
          'Physics Galaxy Insight: Angular velocity ω is a property of the entire rigid body—every point on the rigid body has the exact same ω about every other point.',
      },
      {
        id: 'tLni8Vxf-WA',
        teacher: 'Ashish Arora • Physics Galaxy',
        title: 'Rotational Motion Complete Revision Checklist for JEE',
        duration: '32m',
        chapters: [
          { label: '00:00 Parallel & Perpendicular Axes', sec: 0 },
          { label: '11:30 Torque & Angular Momentum', sec: 690 },
          { label: '22:10 Instantaneous Axis of Rotation', sec: 1330 },
        ],
        notes:
          'JEE Advanced Checklist: Always check conservation of angular momentum about the point of contact on rough surfaces where impulsive friction acts.',
      },
      {
        id: 'YTmtAuItIfY',
        teacher: 'JEE Wallah • One Shot',
        title: 'Semiconductor Electronics One Shot + Top NTA PYQs',
        duration: '1h 45m',
        chapters: [
          { label: '00:00 p-n Junction & Biasing', sec: 0 },
          { label: '35:00 Zener Voltage Regulator', sec: 2100 },
          { label: '1:10:00 Logic Gates & Truth Tables', sec: 4200 },
        ],
        notes:
          "Exam Shortcut: NAND and NOR are universal gates. De Morgan's Theorems: (A + B)' = A'·B' and (A·B)' = A' + B'.",
      },
    ],
    quickWikiTopics: [
      'Semiconductor',
      'Moment of inertia',
      'Second law of thermodynamics',
      'Nucleophilic substitution',
      'Fundamental theorem of calculus',
    ],
    pyqs: [
      {
        year: 'JEE Main 2024',
        q: 'In a Zener diode voltage regulator circuit, if the unregulated input voltage increases while load resistance stays constant, which current increases significantly?',
        opts: [
          'Load current (I_L)',
          'Zener current (I_Z)',
          'Reverse saturation current only',
          'No current changes',
        ],
        ans: 1,
        explain:
          'Since Zener voltage V_Z remains constant across the parallel load R_L, load current I_L = V_Z / R_L stays constant. The extra series current flows through the Zener diode (I_Z).',
      },
      {
        year: 'JEE Adv 2022',
        q: 'A uniform solid cylinder of mass M and radius R rolls without slipping down an inclined plane of angle θ. What is its linear acceleration?',
        opts: ['(2/3) g sinθ', '(5/7) g sinθ', '(1/2) g sinθ', '(3/5) g sinθ'],
        ans: 0,
        explain:
          'For a solid cylinder, I = ½MR². Acceleration a = g sinθ / (1 + I/MR²) = g sinθ / (1 + 1/2) = (2/3) g sinθ.',
      },
      {
        year: 'JEE Main 2023',
        q: 'What is the value of the definite integral ∫₀^(π/2) [√sin x / (√sin x + √cos x)] dx?',
        opts: ['π/2', 'π/4', '1', 'π/6'],
        ans: 1,
        explain:
          "Applying King's Property ∫₀ᵃ f(x)dx = ∫₀ᵃ f(a-x)dx and adding the two integrals yields 2I = ∫₀^(π/2) 1 dx = π/2 ⇒ I = π/4.",
      },
    ],
    flashcards: [
      {
        q: 'State the Mass Action Law in Semiconductors.',
        a: 'Under thermal equilibrium, the product of free electron concentration (nₑ) and hole concentration (nₕ) equals the square of intrinsic carrier concentration: nₑ · nₕ = nᵢ².',
      },
      {
        q: 'What is the Moment of Inertia of a solid sphere about a tangent?',
        a: 'By Parallel Axis Theorem: I = I_cm + MR² = (2/5)MR² + MR² = (7/5)MR².',
      },
      {
        q: 'Order of aqueous basicity for Methyl-substituted amines?',
        a: "2° > 1° > 3° > NH₃ ('213' rule) due to combined inductive, solvation, and steric effects.",
      },
    ],
    syllabus: [
      { id: 'jee-1', title: 'Semiconductor Electronics & Logic Gates (NCERT Ch 14)', defaultDone: true },
      { id: 'jee-2', title: 'Rigid Body Dynamics & Pure Rolling (HC Verma / Irodov)', defaultDone: true },
      { id: 'jee-3', title: 'Definite Integration & Differential Equations', defaultDone: true },
      { id: 'jee-4', title: "Electrostatics & Gauss's Law Applications", defaultDone: false },
      { id: 'jee-5', title: 'Aldehydes, Ketones & Carboxylic Acids', defaultDone: false },
      { id: 'jee-6', title: '3D Coordinate Geometry & Vector Algebra', defaultDone: false },
    ],
  },

  neet: {
    id: 'neet',
    shortLabel: 'NEET',
    badge: 'NEET-UG TRACK',
    heroTag: 'NTA NEET-UG Medical',
    heroTitle: 'NEET Masterclass: NCERT Line-by-Line Video & Whiteboard',
    heroSubtitle:
      'Learn Human Physiology & Physics from Dr. Ritu Rattewal & Alakh Pandey with live ECG waveforms, NCERT diagrams, and AIR predictor.',
    parentLabel: 'NEET-UG (Medical 720)',
    mentorSample:
      'Each cardiac cycle lasts 0.8s at 75 bpm: Atrial systole (0.1s), Ventricular systole (0.3s), and Joint diastole (0.4s). Stroke volume is 70 mL, yielding Cardiac Output = 5040 mL/min.',
    videos: [
      {
        id: '6eho6nvCspU',
        teacher: 'Dr. Ritu Rattewal • Biology',
        title: 'Body Fluids & Circulation: Blood Plasma, Formed Elements & Clotting',
        duration: '1h 18m',
        chapters: [
          { label: '00:00 Blood Plasma Composition', sec: 0 },
          { label: '24:10 RBC, WBC & Platelets', sec: 1450 },
          { label: '48:30 ABO & Rh Blood Grouping', sec: 2910 },
          { label: '1:04:00 Coagulation Cascade', sec: 3840 },
        ],
        notes:
          'NCERT Line-by-Line: Plasma is 55% of blood (90-92% water, 6-8% proteins: Fibrinogen for clotting, Globulins for defense, Albumins for osmotic balance). Calcium ions (Ca²⁺) play a vital role in clotting.',
      },
      {
        id: '3NUb5aDgnO8',
        teacher: 'Dr. Ritu Rattewal • Biology',
        title: 'Cardiac Cycle, Heart Sounds (Lub-Dub) & Standard ECG Decode',
        duration: '1h 05m',
        chapters: [
          { label: '00:00 SA Node & Conducting System', sec: 0 },
          { label: '19:20 0.8s Cardiac Cycle Phases', sec: 1160 },
          { label: '42:10 P-QRS-T ECG Waves', sec: 2530 },
        ],
        notes:
          'Critical NEET Trap: The END of the T-wave marks the END of ventricular systole! First sound (Lub) = closure of tricuspid & bicuspid valves; second sound (Dub) = closure of semilunar valves.',
      },
      {
        id: 'hccEUqoviH8',
        teacher: 'Alakh Pandey • Physics Wallah',
        title: 'Semiconductor Electronics for NEET Physics (Full Concept)',
        duration: '1h 12m',
        chapters: [
          { label: '00:00 Energy Bands & Doping', sec: 0 },
          { label: '30:00 p-n Junction Forward/Reverse', sec: 1800 },
        ],
        notes:
          'NEET Physics High-Yield: Semiconductor devices contribute 2–3 direct questions every year in NEET-UG. Focus on Zener diode and Logic gates.',
      },
    ],
    quickWikiTopics: [
      'Cardiac cycle',
      'Electrocardiography',
      'Lac operon',
      'Photosynthesis',
      'Human heart',
    ],
    pyqs: [
      {
        year: 'NEET 2024',
        q: 'Match the ECG wave with its physiological event: What does the end of the T-wave signify in a standard electrocardiogram?',
        opts: [
          'Beginning of atrial systole',
          'End of ventricular systole',
          'Start of ventricular depolarization',
          'Closure of AV valves',
        ],
        ans: 1,
        explain:
          'Direct NCERT Class 11 Chapter 18 line: T-wave represents ventricular repolarization, and the end of the T-wave marks the end of ventricular systole.',
      },
      {
        year: 'NEET 2023',
        q: 'In the Lac Operon, which molecule binds to the repressor protein and inactivates it to allow transcription of lacZ, lacY, and lacA?',
        opts: ['Glucose', 'Allolactose (Lactose)', 'Galactose', 'RNA Polymerase'],
        ans: 1,
        explain:
          'Lactose (specifically its isomer allolactose) acts as the inducer, binding to the repressor and preventing it from blocking the operator region.',
      },
      {
        year: 'NEET 2022',
        q: 'Which of the following conditions shifts the Oxygen-Hemoglobin dissociation curve to the RIGHT?',
        opts: [
          'High pO₂ and low pCO₂',
          'Low H⁺ concentration and low temperature',
          'High pCO₂, high H⁺ concentration, and elevated temperature',
          'Fetal hemoglobin presence',
        ],
        ans: 2,
        explain:
          'Bohr Effect: Metabolically active tissues have high pCO₂, low pH (high H⁺), and higher temperature, shifting the curve right to unload O₂.',
      },
    ],
    flashcards: [
      {
        q: 'What is the exact duration of Atrial Systole, Ventricular Systole, and Joint Diastole?',
        a: 'Atrial Systole = 0.1s; Ventricular Systole = 0.3s; Joint Diastole = 0.4s (Total = 0.8s at 75 beats/min).',
      },
      {
        q: 'Name the three major plasma proteins and their functions (NCERT).',
        a: 'Fibrinogen (blood clotting), Globulins (defense mechanisms), and Albumins (osmotic balance).',
      },
      {
        q: 'Which blood vessel carries deoxygenated blood from the right ventricle to the lungs?',
        a: 'Pulmonary Artery (exception among arteries, which otherwise carry oxygenated blood).',
      },
    ],
    syllabus: [
      { id: 'neet-1', title: 'Body Fluids & Circulation (NCERT Class 11 Ch 18)', defaultDone: true },
      { id: 'neet-2', title: 'Molecular Basis of Inheritance & Lac Operon (Class 12)', defaultDone: true },
      { id: 'neet-3', title: 'Cell Cycle & Cell Division (Mitosis & Meiosis)', defaultDone: true },
      { id: 'neet-4', title: 'Human Reproduction & Reproductive Health', defaultDone: false },
      { id: 'neet-5', title: 'Chemical Coordination & Integration (Endocrine)', defaultDone: false },
      { id: 'neet-6', title: 'Ray Optics, Modern Physics & Semiconductors', defaultDone: false },
    ],
  },

  upsc: {
    id: 'upsc',
    shortLabel: 'UPSC',
    badge: 'UPSC CSE TRACK',
    heroTag: 'UPSC Civil Services (IAS / IPS)',
    heroTitle: 'UPSC Masterclass: Polity, Economy & Governance Classroom',
    heroSubtitle:
      'Study Indian Constitution, Basic Structure Doctrine & RBI Monetary Policy with Drishti IAS & StudyIQ lectures, live macro simulators, and Prelims cutoff predictor.',
    parentLabel: 'UPSC CSE (Prelims + Mains)',
    mentorSample:
      "In Kesavananda Bharati v. State of Kerala (1973), a 13-judge Supreme Court bench held by 7:6 that Parliament's constituent power under Article 368 cannot alter the Constitution's 'Basic Structure'.",
    videos: [
      {
        id: 'l_Az6q3NXXY',
        teacher: 'Drishti IAS • Polity Foundation',
        title: 'UPSC Polity Basics: Constitutional Framework & Rule of Law',
        duration: '54m',
        chapters: [
          { label: '00:00 Constitutionalism vs Constitution', sec: 0 },
          { label: '18:15 Separation of Powers', sec: 1095 },
          { label: '36:40 Fundamental Rights & Writs', sec: 2200 },
        ],
        notes:
          'UPSC GS-II Core: Constitutionalism implies limited government where executive authority is constrained by Fundamental Rights (Part III) and Judicial Review (Article 13 & 32).',
      },
      {
        id: '49msqaRsc4g',
        teacher: 'StudyIQ IAS • Polity',
        title: 'Basic Structure Doctrine Explained: Kesavananda Bharati (1973)',
        duration: '28m',
        chapters: [
          { label: '00:00 Shankari Prasad to Golaknath', sec: 0 },
          { label: '11:20 24th Amendment & 1973 Verdict', sec: 680 },
          { label: '21:00 Elements of Basic Structure', sec: 1260 },
        ],
        notes:
          "Prelims Trap Alert: The phrase 'Basic Structure' is NOT defined anywhere in the Constitution; it is a judicial innovation evolved case-by-case since 1973.",
      },
      {
        id: 'O3d662mfH_4',
        teacher: 'StudyIQ IAS • Laxmikanth Series',
        title: 'Amendment of the Constitution (Article 368) & Special Majorities',
        duration: '35m',
        chapters: [
          { label: '00:00 Types of Amendments', sec: 0 },
          { label: '15:10 Why No Joint Sitting (Art. 108)', sec: 910 },
        ],
        notes:
          'Article 368 Procedure: Can be initiated in either House of Parliament (NOT State Legislatures), requires no prior President recommendation, and has NO provision for a Joint Sitting.',
      },
    ],
    quickWikiTopics: [
      'Basic structure doctrine',
      'Constitution of India',
      'Reserve Bank of India',
      'Monetary policy of India',
      'Separation of powers',
    ],
    pyqs: [
      {
        year: 'UPSC Prelims 2023',
        q: 'Consider the following statements regarding a Constitutional Amendment Bill under Article 368: 1) It can be introduced in either House of Parliament. 2) In case of a deadlock, the President can summon a Joint Sitting under Article 108. Which is/are correct?',
        opts: ['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2'],
        ans: 0,
        explain:
          'Statement 1 is correct. Statement 2 is incorrect because Article 368 requires each House to pass the bill separately by special majority—there is NO provision for a Joint Sitting.',
      },
      {
        year: 'UPSC Prelims 2022',
        q: 'With reference to the Indian economy, what is the primary purpose of the Standing Deposit Facility (SDF) introduced by the RBI?',
        opts: [
          'Provide collateral-free emergency loans to NBFCs',
          'Absorb excess liquidity from commercial banks without requiring G-Sec collateral',
          'Finance Union fiscal deficit directly',
          'Regulate foreign direct investment',
        ],
        ans: 1,
        explain:
          'Introduced in April 2022, SDF allows the RBI to absorb excess liquidity from commercial banks without needing to provide Government Securities (G-Secs) as collateral.',
      },
      {
        year: 'UPSC Prelims 2021',
        q: "Which Article of the Constitution of India safeguards one's right to marry the person of one's choice?",
        opts: ['Article 19', 'Article 21', 'Article 25', 'Article 29'],
        ans: 1,
        explain:
          "In Shafin Jahan v. Asokan K.M. (2018), the Supreme Court held that the right to marry a person of one's choice is an integral part of Article 21 (Right to Life and Personal Liberty).",
      },
    ],
    flashcards: [
      {
        q: 'Can a Money Bill (Article 110) be introduced in the Rajya Sabha?',
        a: 'No. A Money Bill can ONLY be introduced in the Lok Sabha on the prior recommendation of the President. Rajya Sabha can detain it for at most 14 days.',
      },
      {
        q: 'Name the 8 Indian states through which the Tropic of Cancer passes.',
        a: 'Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.',
      },
      {
        q: "What is the RBI's statutory flexible inflation targeting band?",
        a: '4% Consumer Price Index (CPI) inflation with an upper tolerance limit of 6% and a lower tolerance limit of 2%.',
      },
    ],
    syllabus: [
      { id: 'upsc-1', title: 'Indian Polity: Fundamental Rights & Basic Structure (Laxmikanth)', defaultDone: true },
      { id: 'upsc-2', title: 'Parliamentary Procedures, Money Bills & Committees', defaultDone: true },
      { id: 'upsc-3', title: 'RBI Monetary Policy, Inflation & Banking Reforms', defaultDone: true },
      { id: 'upsc-4', title: 'Modern Indian History: 1857 to Independence (Spectrum)', defaultDone: false },
      { id: 'upsc-5', title: 'Physical & Indian Geography (NCERT Class 11–12)', defaultDone: false },
      { id: 'upsc-6', title: 'GS-IV Ethics Case Studies & 2nd ARC Governance', defaultDone: false },
    ],
  },
};

export const LEARNING_PLATFORMS: LearningPlatform[] = [
  { name: 'NTA JEE Main Portal', cat: 'govt', tag: 'Official Exam Body', desc: 'Official JEE Main notifications, syllabus PDFs, and mock test links.', url: 'https://jeemain.nta.nic.in/' },
  { name: 'NTA NEET-UG Portal', cat: 'govt', tag: 'Official Exam Body', desc: 'Official NEET-UG medical entrance portal, bulletins, and answer keys.', url: 'https://neet.nta.nic.in/' },
  { name: 'UPSC Official Portal', cat: 'govt', tag: 'Constitutional Body', desc: 'Civil Services Prelims/Mains notifications, annual calendar, and PYQ papers.', url: 'https://upsc.gov.in/' },
  { name: 'NCERT Official e-Books', cat: 'govt', tag: 'Core Foundation', desc: 'Free official Class 6–12 Science, Math, Polity, History & Geography textbooks.', url: 'https://ncert.nic.in/textbook.php' },
  { name: 'DIKSHA Govt Portal', cat: 'govt', tag: 'Ministry of Education', desc: 'QR-linked interactive NCERT video lessons and exemplar worksheets.', url: 'https://diksha.gov.in/' },
  { name: 'SWAYAM MOOCs', cat: 'govt', tag: 'Govt of India', desc: 'Free university-level courses taught by IIT, IIM, and central university faculty.', url: 'https://swayam.gov.in/' },
  { name: 'NPTEL IIT Lectures', cat: 'govt', tag: 'IIT / IISc', desc: 'Deep engineering & science video lectures and assignments from IIT professors.', url: 'https://nptel.ac.in/' },
  { name: 'PIB Daily Releases', cat: 'govt', tag: 'UPSC Current Affairs', desc: 'Press Information Bureau official government schemes, policies, and cabinet decisions.', url: 'https://pib.gov.in/' },
  { name: 'PRS Legislative Research', cat: 'govt', tag: 'UPSC Polity & Bills', desc: 'Non-partisan summaries of Parliamentary Bills, Standing Committee reports, and Acts.', url: 'https://prsindia.org/' },
  { name: 'Reserve Bank of India (RBI)', cat: 'govt', tag: 'UPSC Economy', desc: 'Monetary Policy Committee (MPC) statements, Repo/CRR rates, and macroeconomic reports.', url: 'https://www.rbi.org.in/' },

  { name: 'Physics Wallah (PW)', cat: 'jeeneet', tag: 'JEE & NEET', desc: 'Alakh Pandey & faculty batches, DPPs, and affordable JEE/NEET test series.', url: 'https://www.pw.live/' },
  { name: 'Physics Galaxy', cat: 'jeeneet', tag: 'JEE Physics', desc: "Ashish Arora's conceptual physics lectures, revision checklists, and Olympiad prep.", url: 'https://www.physicsgalaxy.com/' },
  { name: 'Khan Academy India', cat: 'jeeneet', tag: 'Free Mastery', desc: 'Interactive mastery exercises in Physics, Chemistry, Biology, and Calculus.', url: 'https://www.khanacademy.org/' },
  { name: 'PhET Interactive Simulations', cat: 'jeeneet', tag: 'CU Boulder Labs', desc: 'Interactive HTML5 physics, chemistry, and math simulations for visual intuition.', url: 'https://phet.colorado.edu/' },
  { name: 'Desmos Graphing Calculator', cat: 'jeeneet', tag: 'JEE Math Visuals', desc: 'Instant 2D/3D function plotting, calculus derivatives, and conic sections explorer.', url: 'https://www.desmos.com/calculator' },
  { name: 'WolframAlpha Engine', cat: 'jeeneet', tag: 'Computational AI', desc: 'Step-by-step symbolic calculus, differential equations, and chemical stoichiometry.', url: 'https://www.wolframalpha.com/' },
  { name: 'Allen Digital', cat: 'jeeneet', tag: 'JEE & NEET', desc: 'All-India test series, structured modules, and Kota classroom mentorship.', url: 'https://allen.in/' },
  { name: 'Unacademy JEE / NEET', cat: 'jeeneet', tag: 'Live Educators', desc: 'Live classes, educator notes, and All-India mock tests across streams.', url: 'https://unacademy.com/' },
  { name: 'Vedantu Master', cat: 'jeeneet', tag: 'LIVE Interactive', desc: 'Interactive WAVE platform classes, NCERT solutions, and doubt solving.', url: 'https://www.vedantu.com/' },

  { name: 'Drishti IAS', cat: 'upsc', tag: 'UPSC CSE', desc: 'Daily current affairs, editorial analysis, GS foundation, and Hindi/English resources.', url: 'https://www.drishtiias.com/' },
  { name: 'Vision IAS', cat: 'upsc', tag: 'UPSC Test Series', desc: 'PT 365, Mains 365 current affairs compilations, and All-India Prelims/Mains mocks.', url: 'https://www.visionias.in/' },
  { name: 'InsightsIAS', cat: 'upsc', tag: 'Daily Answer Writing', desc: 'Secure daily Mains answer writing initiative and daily Prelims static quizzes.', url: 'https://www.insightsonindia.com/' },
  { name: 'ClearIAS', cat: 'upsc', tag: 'Self-Study UPSC', desc: 'Structured UPSC notes, elimination techniques, and online mock test platform.', url: 'https://www.clearias.com/' },
  { name: 'Sansad TV', cat: 'upsc', tag: 'Parliamentary Debates', desc: 'Official broadcasts of Lok Sabha, Rajya Sabha, and policy panel discussions.', url: 'https://sansadtv.nic.in/' },
  { name: 'MIT OpenCourseWare', cat: 'upsc', tag: 'Global Open Knowledge', desc: 'Free MIT lecture notes, exams, and videos across science, economics, and humanities.', url: 'https://ocw.mit.edu/' },
];

export const OFFLINE_WIKI_FALLBACK: Record<string, WikiFallbackEntry> = {
  Semiconductor: {
    title: 'Semiconductor',
    description: 'Material with electrical conductivity between a conductor and an insulator',
    extract:
      "A semiconductor is a material whose electrical conductivity falls between that of a conductor, such as copper, and an insulator, such as glass. Its resistivity falls as its temperature rises; metals behave in the opposite way. Its conducting properties may be altered in useful ways by introducing impurities ('doping') into the crystal structure, creating p-n junctions that form the foundation of diodes, transistors, and modern integrated circuits.",
    url: 'https://en.wikipedia.org/wiki/Semiconductor',
  },
  'Cardiac cycle': {
    title: 'Cardiac cycle',
    description: 'Performance of the human heart from the beginning of one heartbeat to the beginning of the next',
    extract:
      'The cardiac cycle is the performance of the human heart from the beginning of one heartbeat to the beginning of the next. It consists of two periods: one during which the heart muscle relaxes and refills with blood, called diastole, following a period of robust contraction and pumping of blood, called systole. At a normal heart rate of 75 beats per minute, one cardiac cycle lasts 0.8 seconds.',
    url: 'https://en.wikipedia.org/wiki/Cardiac_cycle',
  },
  'Basic structure doctrine': {
    title: 'Basic structure doctrine',
    description: 'Indian judicial principle that the Constitution has certain basic features that cannot be altered',
    extract:
      'The basic structure doctrine is a common law legal doctrine that the constitution of a sovereign state has certain characteristics that cannot be erased by its legislature. Propounded by the Supreme Court of India in the landmark Kesavananda Bharati v. State of Kerala (1973) ruling, it holds that while Parliament has wide power to amend the Constitution under Article 368, it cannot destroy its basic features such as democracy, secularism, federalism, and judicial review.',
    url: 'https://en.wikipedia.org/wiki/Basic_structure_doctrine',
  },
};
