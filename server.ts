import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '4mb' }));

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Server-side in-memory ledger & accountability state (persisted across API calls in runtime)
interface ServerGuardianEvent {
  id: string;
  type: 'session_started' | 'session_completed' | 'early_exit';
  title: string;
  message: string;
  timestamp: string;
  plannedMinutes: number;
  actualMinutes: number;
  remainingMinutes: number;
}

const serverState = {
  guardianEvents: [] as ServerGuardianEvent[],
  payoutRequests: [] as Array<{
    courseId: string;
    upiOrBankMasked: string;
    amountInr: number;
    guardianAuthorized: boolean;
    transactionId: string;
    timestamp: string;
  }>,
};

// 1. Time-Adaptive Study Schedule Generator (strictly <= availableMinutes)
app.post('/api/ai/schedule', async (req, res) => {
  const availableMinutes = Math.max(10, Math.min(240, Number(req.body?.minutes) || 45));
  const focusTopic = String(req.body?.topic || 'Semiconductor Physics');
  const weakAreas: string[] = Array.isArray(req.body?.weakAreas)
    ? req.body.weakAreas
    : ['Extrinsic Doping', 'Mass Action Law'];

  const fallbackBlocks = buildDeterministicSchedule(availableMinutes, focusTopic, weakAreas);
  const ai = getGeminiClient();

  if (!ai) {
    return res.json({ blocks: fallbackBlocks, source: 'deterministic-demo' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Generate a realistic, cognitive-science study schedule for a student who has EXACTLY ${availableMinutes} uninterrupted minutes right now.
Focus topic: ${focusTopic}. Weak concepts to prioritize: ${weakAreas.join(', ')}.
Rules:
1. The sum of durationMinutes across all blocks MUST NOT exceed ${availableMinutes} (ideally equals ${availableMinutes}).
2. Every lecture block MUST be <= 20 minutes.
3. Include a balanced mix of micro-lecture, active-recall flashcards, 5-minute quiz, spaced revision, and a short break if >= 45 minutes.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtopic: { type: Type.STRING },
                  activityType: {
                    type: Type.STRING,
                    description: 'One of: lecture, recall, quiz, revision, break',
                  },
                  durationMinutes: { type: Type.INTEGER },
                },
                required: ['title', 'subtopic', 'activityType', 'durationMinutes'],
              },
            },
          },
          required: ['blocks'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const rawBlocks: Array<any> = Array.isArray(parsed.blocks) ? parsed.blocks : [];
    // Enforce strict budget invariant: never exceed availableMinutes and lectures <= 20 min
    let running = 0;
    const bounded = rawBlocks
      .map((b, idx) => {
        const type = ['lecture', 'recall', 'quiz', 'revision', 'break'].includes(b.activityType)
          ? b.activityType
          : 'recall';
        let dur = Math.max(3, Number(b.durationMinutes) || 5);
        if (type === 'lecture' && dur > 20) dur = 20;
        if (running + dur > availableMinutes) {
          dur = availableMinutes - running;
        }
        running += dur;
        return {
          id: `blk-${Date.now()}-${idx}`,
          title: String(b.title || 'Focused Block'),
          subtopic: String(b.subtopic || focusTopic),
          activityType: type,
          durationMinutes: dur,
          completed: false,
          lectureId: type === 'lecture' ? 'lec-semi-1' : undefined,
        };
      })
      .filter((b) => b.durationMinutes > 0);

    if (bounded.length === 0) {
      return res.json({ blocks: fallbackBlocks, source: 'deterministic-fallback' });
    }
    return res.json({ blocks: bounded, source: 'gemini' });
  } catch (error) {
    console.error('Schedule AI error:', error);
    return res.json({ blocks: fallbackBlocks, source: 'deterministic-fallback' });
  }
});

function buildDeterministicSchedule(minutes: number, topic: string, weakAreas: string[]) {
  const blocks: Array<any> = [];
  let rem = minutes;

  const lecDur = Math.min(20, Math.max(8, Math.floor(minutes * 0.4)));
  blocks.push({
    id: 'blk-1',
    title: `Micro-Lecture: ${topic}`,
    subtopic: 'PN Junction & Carrier Diffusion (<= 20 min)',
    activityType: 'lecture',
    durationMinutes: Math.min(rem, lecDur),
    completed: false,
    lectureId: 'lec-semi-1',
  });
  rem -= Math.min(rem, lecDur);

  if (rem >= 10) {
    const recallDur = Math.min(rem, Math.max(5, Math.floor(minutes * 0.2)));
    blocks.push({
      id: 'blk-2',
      title: 'Active Recall Flashcards',
      subtopic: weakAreas[0] || 'Mass Action Law',
      activityType: 'recall',
      durationMinutes: recallDur,
      completed: false,
    });
    rem -= recallDur;
  }

  if (minutes >= 45 && rem >= 8) {
    blocks.push({
      id: 'blk-break',
      title: 'Eye-Rest & Hydration Break',
      subtopic: 'Step away from screen',
      activityType: 'break',
      durationMinutes: 3,
      completed: false,
    });
    rem -= 3;
  }

  if (rem >= 5) {
    const quizDur = Math.min(rem, 5);
    blocks.push({
      id: 'blk-3',
      title: '5-Minute Concept Check Quiz',
      subtopic: 'Verify conceptual mastery',
      activityType: 'quiz',
      durationMinutes: quizDur,
      completed: false,
    });
    rem -= quizDur;
  }

  if (rem > 0) {
    blocks.push({
      id: 'blk-4',
      title: 'Spaced Repetition Retrieval',
      subtopic: weakAreas[1] || '1-Day & 3-Day Review Queue',
      activityType: 'revision',
      durationMinutes: rem,
      completed: false,
    });
  }

  return blocks;
}

// 2. Subtopic Completion -> Auto-Generate Flashcards + 5-Min Quiz
app.post('/api/ai/subtopic-pack', async (req, res) => {
  const subtopicTitle = String(req.body?.subtopicTitle || 'Extrinsic Semiconductors');
  const topicTitle = String(req.body?.topicTitle || 'Semiconductor Physics');
  const level = String(req.body?.level || 'Intermediate');

  const fallback = {
    flashcards: [
      {
        id: `fc-gen-1-${Date.now()}`,
        subtopicTitle,
        category: 'Concept',
        front: `What differentiates ${subtopicTitle} from pure intrinsic Silicon?`,
        back: 'Controlled ppm-level doping with trivalent (P-type) or pentavalent (N-type) impurities shifts majority carrier density by orders of magnitude.',
      },
      {
        id: `fc-gen-2-${Date.now()}`,
        subtopicTitle,
        category: 'Formula',
        front: `Write the equilibrium carrier relation governing ${subtopicTitle}.`,
        back: 'n_e · n_h = n_i² (Mass Action Law), valid for both N-type and P-type semiconductors at thermal equilibrium.',
      },
      {
        id: `fc-gen-3-${Date.now()}`,
        subtopicTitle,
        category: 'Trap',
        front: `Common exam trap regarding electrical neutrality in ${subtopicTitle}?`,
        back: 'Despite excess free electrons or holes, the crystal stays electrically neutral because ionized donor/acceptor cores balance the charge.',
      },
    ],
    quiz: [
      {
        id: `qz-gen-1-${Date.now()}`,
        question: `In ${subtopicTitle} (${level} level), which statement holds true at room temperature?`,
        options: [
          'The doped semiconductor carries a net static charge.',
          'n_e · n_h = n_i² holds at thermal equilibrium.',
          'Dopant atoms are added at >10% atomic concentration.',
          'Minority carriers increase when majority carriers increase.',
        ],
        correctIndex: 1,
        explanation: 'Adding majority carriers increases recombination, suppressing minority carriers so the product n_e · n_h stays equal to n_i².',
        conceptTag: subtopicTitle,
      },
      {
        id: `qz-gen-2-${Date.now()}`,
        question: 'Which impurity turns pure Germanium into an N-type semiconductor?',
        options: ['Boron (Group 13)', 'Indium (Group 13)', 'Arsenic (Group 15)', 'Aluminium (Group 13)'],
        correctIndex: 2,
        explanation: 'Pentavalent Group 15 elements (P, As, Sb) donate a fifth valence electron to the conduction band.',
        conceptTag: 'Doping Valency',
      },
    ],
  };

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({ ...fallback, source: 'deterministic-demo' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `A student just finished the subtopic "${subtopicTitle}" inside "${topicTitle}" at ${level} proficiency.
Generate 3 high-yield active-recall flashcards (categories: Concept, Formula, Trap) and 2 conceptual 5-minute quiz MCQs (4 options each).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                },
                required: ['category', 'front', 'back'],
              },
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  conceptTag: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'explanation', 'conceptTag'],
              },
            },
          },
          required: ['flashcards', 'quiz'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const flashcards = (parsed.flashcards || []).map((f: any, idx: number) => ({
      id: `fc-ai-${Date.now()}-${idx}`,
      subtopicTitle,
      category: ['Definition', 'Formula', 'Concept', 'Trap'].includes(f.category) ? f.category : 'Concept',
      front: f.front,
      back: f.back,
    }));
    const quiz = (parsed.quiz || []).map((q: any, idx: number) => ({
      id: `qz-ai-${Date.now()}-${idx}`,
      question: q.question,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : fallback.quiz[0].options,
      correctIndex: Math.min(3, Math.max(0, Number(q.correctIndex) || 0)),
      explanation: q.explanation,
      conceptTag: q.conceptTag || subtopicTitle,
    }));

    if (flashcards.length === 0 || quiz.length === 0) {
      return res.json({ ...fallback, source: 'deterministic-fallback' });
    }
    return res.json({ flashcards, quiz, source: 'gemini' });
  } catch (error) {
    console.error('Subtopic pack error:', error);
    return res.json({ ...fallback, source: 'deterministic-fallback' });
  }
});

// 3. Weekend Blurting Method Evaluator
app.post('/api/ai/blurting-eval', async (req, res) => {
  const topicHeading = String(req.body?.topicHeading || 'Semiconductor Physics');
  const studentText = String(req.body?.studentText || '').trim();
  const expectedConcepts: string[] = Array.isArray(req.body?.expectedConcepts)
    ? req.body.expectedConcepts
    : [
        'Energy band gap (E_g ~ 1.1 eV for Si)',
        'Intrinsic carriers and thermal generation',
        'P-type (trivalent acceptor, holes) vs N-type (pentavalent donor, electrons)',
        'Mass Action Law (n_e · n_h = n_i²)',
        'PN junction diffusion vs drift and depletion layer',
        'Forward vs Reverse bias and knee voltage',
      ];

  if (studentText.length < 20) {
    return res.status(400).json({ error: 'Please write at least a couple of sentences from memory before evaluating.' });
  }

  const lower = studentText.toLowerCase();
  const coveredFallback = expectedConcepts.filter((c) => {
    const words = c.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    return words.some((w) => lower.includes(w));
  });
  const missingFallback = expectedConcepts.filter((c) => !coveredFallback.includes(c));
  const ratio = Math.round((coveredFallback.length / expectedConcepts.length) * 100);

  const fallbackEval = {
    accuracyScore: Math.max(45, Math.min(95, ratio + 18)),
    completenessScore: Math.max(25, ratio),
    clarityScore: studentText.length > 180 ? 82 : 68,
    coveredConcepts: coveredFallback.length ? coveredFallback : ['Basic semiconductor terminology'],
    missingConcepts: missingFallback,
    conceptConnections:
      'You captured core qualitative terms; tighten the causal bridge between concentration-gradient diffusion and the steady-state depletion electric field.',
    improvementPlan: [
      'Re-derive n_e · n_h = n_i² from generation-recombination equilibrium without notes.',
      'Sketch the forward vs reverse bias depletion barrier diagram.',
      'Schedule a 1-day spaced recall check on missing concepts.',
    ],
  };

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({ evaluation: fallbackEval, source: 'deterministic-demo' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Evaluate this student's closed-book Sunday "Blurting Method" active-recall writeup on the topic "${topicHeading}".
Key reference syllabus points: ${expectedConcepts.join('; ')}.

Student's unassisted recall submission:
"""
${studentText}
"""

Score fairly on conceptual accuracy (0-100), completeness (0-100), clarity (0-100), list covered concepts, list specific missing concepts/formulas, evaluate connections between concepts, and give 3 concrete improvement steps.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            accuracyScore: { type: Type.INTEGER },
            completenessScore: { type: Type.INTEGER },
            clarityScore: { type: Type.INTEGER },
            coveredConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            conceptConnections: { type: Type.STRING },
            improvementPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'accuracyScore',
            'completenessScore',
            'clarityScore',
            'coveredConcepts',
            'missingConcepts',
            'conceptConnections',
            'improvementPlan',
          ],
        },
      },
    });

    const evaluation = JSON.parse((response.text ?? '{}').trim());
    return res.json({ evaluation, source: 'gemini' });
  } catch (error) {
    console.error('Blurting eval error:', error);
    return res.json({ evaluation: fallbackEval, source: 'deterministic-fallback' });
  }
});

// 4. 24/7 AI Assistant, Socratic Tutor, & Instant Lecture Timestamp Ask-AI
app.post('/api/ai/tutor', async (req, res) => {
  const mode = String(req.body?.mode || 'socratic'); // 'socratic' | 'direct' | 'lecture'
  const message = String(req.body?.message || '').trim();
  const context = String(req.body?.context || 'Semiconductor Physics — PN Junction Diode');

  if (!message) {
    return res.status(400).json({ error: 'Question cannot be empty.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    const reply =
      mode === 'socratic'
        ? `Let's reason through this step by step instead of jumping straight to the formula. Looking at "${context}": when majority carriers diffuse across the junction, what kind of charge do the immobile ions left behind carry? Reply with your intuition!`
        : `Based on "${context}", remember that diffusion is driven by the carrier concentration gradient while drift is driven by the built-in electric field across the depletion zone. At equilibrium, both currents cancel (I_net = 0).`;
    return res.json({ reply, source: 'deterministic-demo' });
  }

  const systemInstruction =
    mode === 'socratic'
      ? `You are MindForge's Socratic AI Tutor. Do NOT immediately give away the final answer unless the student explicitly asks for a full explanation. First acknowledge their thinking, give 1 concise conceptual hint, and ask 1 targeted guiding question to help them discover the principle.`
      : mode === 'lecture'
      ? `You are an Instant Lecture Timestamp Doubt Solver. Answer directly using the provided lecture timestamp context in clear, exam-oriented steps with formulas.`
      : `You are MindForge's 24/7 AI Learning Assistant. Explain concepts clearly, connect to first principles, and suggest a brief recall check.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Context: ${context}\n\nStudent message: ${message}`,
      config: { systemInstruction },
    });
    return res.json({ reply: response.text ?? 'Unable to generate response.', source: 'gemini' });
  } catch (error) {
    console.error('Tutor AI error:', error);
    return res.status(500).json({ error: 'AI Tutor could not process this request right now.' });
  }
});

function extractYouTubeVideoId(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = u.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      if (['shorts', 'live', 'embed', 'v'].includes(parts[0]) && parts[1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[1])) {
        return parts[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

const NOTES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    shortNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
    definitions: { type: Type.ARRAY, items: { type: Type.STRING } },
    formulas: { type: Type.ARRAY, items: { type: Type.STRING } },
    takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING },
          back: { type: Type.STRING },
        },
        required: ['front', 'back'],
      },
    },
  },
  required: ['title', 'shortNotes', 'definitions', 'formulas', 'takeaways', 'flashcards'],
};

// 5. Link-to-Notes AI (YouTube videos, public articles, or pasted transcripts)
app.post('/api/ai/link-to-notes', async (req, res) => {
  const url = String(req.body?.url || '').trim();
  const pastedTranscript = String(req.body?.pastedTranscript || '').trim();

  if (!url && !pastedTranscript) {
    return res.status(400).json({ error: 'Provide a YouTube link, educational URL, or paste transcript/article text.' });
  }

  const ytVideoId = url ? extractYouTubeVideoId(url) : null;
  const ai = getGeminiClient();

  // Branch A: YouTube Video Link
  if (ytVideoId) {
    const canonicalUrl = `https://www.youtube.com/watch?v=${ytVideoId}`;
    let videoMeta: { title: string; author: string; thumbnailUrl: string; url: string } | null = null;

    try {
      const oRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`
      );
      if (oRes.ok) {
        const oData: any = await oRes.json();
        videoMeta = {
          title: String(oData.title || 'YouTube Lecture'),
          author: String(oData.author_name || 'Creator'),
          thumbnailUrl: String(oData.thumbnail_url || `https://i.ytimg.com/vi/${ytVideoId}/hqdefault.jpg`),
          url: canonicalUrl,
        };
      }
    } catch {
      // Ignore oEmbed failure and check if transcript was pasted
    }

    if (!videoMeta && !pastedTranscript) {
      return res.status(422).json({
        error:
          'This YouTube video could not be accessed (it may be private, unlisted, or have an invalid ID). Check the link or paste the transcript below.',
      });
    }

    const displayTitle = videoMeta ? `${videoMeta.title} (${videoMeta.author})` : 'YouTube Lecture Notes';

    if (ai) {
      // 1) If transcript pasted alongside YouTube URL, prioritize strict transcript extraction
      if (pastedTranscript) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `Extract structured study notes and 4 high-yield active-recall flashcards strictly from this YouTube lecture transcript.
Video: ${displayTitle} (${canonicalUrl})
Transcript:
"""
${pastedTranscript.slice(0, 7500)}
"""`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: NOTES_SCHEMA,
            },
          });
          const notes = JSON.parse((response.text ?? '{}').trim());
          return res.json({ notes, videoMeta, source: 'gemini-transcript' });
        } catch (err) {
          console.error('YouTube transcript AI error:', err);
        }
      }

      // 2) Try Gemini native YouTube video understanding via fileData.fileUri
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: [
            {
              fileData: {
                fileUri: canonicalUrl,
              },
            },
            {
              text: `Watch and analyze this educational YouTube video ("${displayTitle}"). Generate:
- title: concise lecture title
- shortNotes: 4-5 structured bullet study notes covering the core explanation
- definitions: 2-4 key terms or principles defined in the video
- formulas: 2-4 important formulas, equations, or rules shown (if none, key mental models)
- takeaways: 3 exam-oriented takeaways
- flashcards: 4 high-yield active-recall flashcards (front question + concise back answer)`,
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: NOTES_SCHEMA,
          },
        });
        const notes = JSON.parse((response.text ?? '{}').trim());
        return res.json({ notes, videoMeta, source: 'gemini-youtube-video' });
      } catch (videoErr) {
        console.warn('Gemini direct YouTube fileData fallback triggered:', videoErr instanceof Error ? videoErr.message : videoErr);
      }

      // 3) Fallback: Grounded Search + Structured JSON synthesis using verified oEmbed title & author
      if (videoMeta) {
        try {
          const searchResp = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `Summarize the exact educational concepts, definitions, formulas, and key points taught in the YouTube video "${videoMeta.title}" by ${videoMeta.author} (${canonicalUrl}).`,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });
          const groundedSummary = (searchResp.text ?? '').trim();
          if (groundedSummary.length > 60) {
            const structResp = await ai.models.generateContent({
              model: 'gemini-4-hydrogen',
              contents: `Convert this verified summary of the YouTube lecture "${videoMeta.title}" by ${videoMeta.author} into structured study notes and 4 active-recall flashcards:\n\n${groundedSummary}`,
              config: {
                responseMimeType: 'application/json',
                responseSchema: NOTES_SCHEMA,
              },
            });
            const notes = JSON.parse((structResp.text ?? '{}').trim());
            return res.json({ notes, videoMeta, source: 'gemini-search-grounded' });
          }
        } catch (searchErr) {
          console.error('YouTube grounded search fallback error:', searchErr);
        }
      }
    }

    // Deterministic offline fallback when GEMINI_API_KEY is missing or unavailable
    const fallbackYtNotes = {
      title: displayTitle,
      shortNotes: [
        `Verified YouTube video: "${videoMeta?.title || 'Educational Lecture'}" by ${videoMeta?.author || 'Instructor'}.`,
        pastedTranscript
          ? `Transcript excerpt captured (${pastedTranscript.length} chars).`
          : 'Configure GEMINI_API_KEY to enable automated full-video conceptual extraction, or paste the video transcript below for instant parsing.',
      ],
      definitions: [`Core topic: ${videoMeta?.title || 'See video link'}`],
      formulas: ['Review key derivations presented in the lecture timeline.'],
      takeaways: ['Convert each video concept into an active-recall flashcard before moving on.'],
      flashcards: [
        {
          front: `What is the central concept taught in "${videoMeta?.title || 'this lecture'}"?`,
          back: pastedTranscript
            ? pastedTranscript.slice(0, 220) + (pastedTranscript.length > 220 ? '...' : '')
            : `Lecture by ${videoMeta?.author || 'instructor'} — link verified (${canonicalUrl}).`,
        },
      ],
    };
    return res.json({ notes: fallbackYtNotes, videoMeta, source: 'deterministic-demo' });
  }

  // Branch B: Non-YouTube Article / Document URL or Pasted Text
  let sourceText = pastedTranscript;
  let fetchedFromUrl = false;

  if (!sourceText && url) {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4500);
        const resp = await fetch(parsedUrl.toString(), {
          signal: controller.signal,
          headers: { 'User-Agent': 'MindForge-Edu-Extractor/1.0' },
        });
        clearTimeout(timer);
        if (resp.ok) {
          const ct = resp.headers.get('content-type') || '';
          if (ct.includes('text/html') || ct.includes('text/plain')) {
            const raw = await resp.text();
            const cleaned = raw
              .replace(/<script[\s\S]*?<\/script>/gi, ' ')
              .replace(/<style[\s\S]*?<\/style>/gi, ' ')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 7000);
            if (cleaned.length > 180) {
              sourceText = cleaned;
              fetchedFromUrl = true;
            }
          }
        }
      }
    } catch {
      // Fall through to honest error if inaccessible
    }
  }

  if (!sourceText) {
    return res.status(422).json({
      error:
        'Source transcript or document text could not be fetched directly from this URL (gated pages or binary PDFs require pasting an excerpt below so notes are never fabricated).',
    });
  }

  const fallbackNotes = {
    title: fetchedFromUrl ? `Extracted Notes from ${url}` : 'Structured Study Notes from Pasted Material',
    shortNotes: [
      'Core concept extracted directly from supplied educational text.',
      'Focuses on verifiable definitions, causal relationships, and exam checkpoints.',
    ],
    definitions: ['Derived strictly from supplied transcript/article excerpt.'],
    formulas: ['Review quantitative relationships stated in source material.'],
    takeaways: ['Verify understanding via the generated flashcards below.'],
    flashcards: [
      {
        front: 'What is the central thesis of the supplied material?',
        back: sourceText.slice(0, 220) + (sourceText.length > 220 ? '...' : ''),
      },
    ],
  };

  if (!ai) {
    return res.json({ notes: fallbackNotes, source: 'deterministic-demo' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Extract structured study notes and 4 flashcards strictly from the following source text. Do NOT invent facts outside the source text.
Source URL: ${url || 'Direct transcript paste'}
Source Text:
"""
${sourceText.slice(0, 6500)}
"""`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: NOTES_SCHEMA,
      },
    });
    const notes = JSON.parse((response.text ?? '{}').trim());
    return res.json({ notes, source: 'gemini' });
  } catch (error) {
    console.error('Link-to-notes error:', error);
    return res.json({ notes: fallbackNotes, source: 'deterministic-fallback' });
  }
});

// 6. AI Answer Grader (typed or handwritten image upload)
app.post('/api/ai/grade-answer', async (req, res) => {
  const question = String(req.body?.question || '').trim();
  const studentAnswer = String(req.body?.studentAnswer || '').trim();
  const imageBase64 = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : '';
  const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType : 'image/png';

  if (!studentAnswer && !imageBase64) {
    return res.status(400).json({ error: 'Provide a typed answer or upload an image of your notebook page.' });
  }

  const fallbackGrade = {
    score: 84,
    accuracy: 'Strong conceptual direction with minor missing derivation steps.',
    missingSteps: ['Explicitly state boundary condition before simplifying.', 'Include SI units in final numeric check.'],
    mentorFeedback: 'Good structural flow. A human mentor can review or override this score in the Mentor Dashboard.',
  };

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({ result: fallbackGrade, source: 'deterministic-demo' });
  }

  try {
    const parts: Array<any> = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }
    parts.push({
      text: `Grade this subjective STEM student response for the question: "${question || 'Physics/Math Subjective Answer'}".
Typed response (if provided): ${studentAnswer || '(See attached handwritten answer sheet)'}
Evaluate accuracy, logical flow, missing steps, mathematical correctness, and give constructive mentor-style feedback.`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            accuracy: { type: Type.STRING },
            missingSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            mentorFeedback: { type: Type.STRING },
          },
          required: ['score', 'accuracy', 'missingSteps', 'mentorFeedback'],
        },
      },
    });
    const result = JSON.parse((response.text ?? '{}').trim());
    return res.json({ result, source: 'gemini' });
  } catch (error) {
    console.error('Grade answer error:', error);
    return res.json({ result: fallbackGrade, source: 'deterministic-fallback' });
  }
});

// 7. Parental Accountability & Study Session APIs
app.post('/api/sessions/start', (req, res) => {
  const plannedMinutes = Number(req.body?.plannedMinutes) || 45;
  const topicTitle = String(req.body?.topicTitle || 'Semiconductor Physics');
  const now = new Date();
  const expectedEnd = new Date(now.getTime() + plannedMinutes * 60_000);
  const expectedEndLabel = expectedEnd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const nowLabel = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const event: ServerGuardianEvent = {
    id: `gn-${Date.now()}`,
    type: 'session_started',
    title: `Study session started (${plannedMinutes} min)`,
    message: `Your child has started studying "${topicTitle}" for ${plannedMinutes} minutes. Expected completion: ${expectedEndLabel}.`,
    timestamp: `Today · ${nowLabel}`,
    plannedMinutes,
    actualMinutes: 0,
    remainingMinutes: plannedMinutes,
  };
  serverState.guardianEvents.unshift(event);
  return res.json({ event, expectedEndLabel });
});

app.post('/api/sessions/end', (req, res) => {
  const plannedMinutes = Number(req.body?.plannedMinutes) || 45;
  const actualMinutes = Math.max(1, Number(req.body?.actualMinutes) || 1);
  const voluntaryEarlyExit = Boolean(req.body?.voluntaryEarlyExit);
  const topicTitle = String(req.body?.topicTitle || 'Semiconductor Physics');
  const remainingMinutes = Math.max(0, plannedMinutes - actualMinutes);
  const nowLabel = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const event: ServerGuardianEvent = voluntaryEarlyExit
    ? {
        id: `gn-${Date.now()}`,
        type: 'early_exit',
        title: 'Voluntary early exit notification',
        message: `Student ended "${topicTitle}" early. Actual studied: ${actualMinutes} min. Remaining planned time: ${remainingMinutes} min.`,
        timestamp: `Today · ${nowLabel}`,
        plannedMinutes,
        actualMinutes,
        remainingMinutes,
      }
    : {
        id: `gn-${Date.now()}`,
        type: 'session_completed',
        title: `Study session completed (${actualMinutes} min)`,
        message: `Student completed the planned "${topicTitle}" session (${actualMinutes}/${plannedMinutes} min).`,
        timestamp: `Today · ${nowLabel}`,
        plannedMinutes,
        actualMinutes,
        remainingMinutes: 0,
      };

  serverState.guardianEvents.unshift(event);
  return res.json({ event });
});

// 8. 70% Refundable Deposit Payout Initiation (Escrow Workflow Demo Mode)
app.post('/api/deposits/payout', (req, res) => {
  const courseId = String(req.body?.courseId || 'dep-jee-physics');
  const upiOrBankMasked = String(req.body?.upiOrBankMasked || 'HDFC •••• 4821');
  const amountInr = Number(req.body?.amountInr) || 700;
  const guardianAuthorized = Boolean(req.body?.guardianAuthorized);

  if (!guardianAuthorized) {
    return res.status(400).json({ error: 'Guardian authorization is required for minors before initiating bank/UPI payout.' });
  }

  const transactionId = `MFG-ESCROW-${Math.floor(100000 + Math.random() * 900000)}`;
  const record = {
    courseId,
    upiOrBankMasked,
    amountInr,
    guardianAuthorized,
    transactionId,
    timestamp: new Date().toISOString(),
  };
  serverState.payoutRequests.push(record);
  return res.json({
    status: 'transferred',
    transactionId,
    expectedProcessing: 'Instant IMPS / UPI Settlement (Demo Escrow Mode)',
    record,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MindForge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
