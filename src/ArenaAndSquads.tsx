import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Headphones,
  Heart,
  Lock,
  MessageSquare,
  Play,
  Shield,
  Swords,
  Users,
  CheckCircle2,
  Flag,
} from 'lucide-react';
import {
  CONCEPT_REELS_DATA,
  INITIAL_SKILL_TREE,
  PODCAST_EPISODES,
  STORIES_DATA,
} from '../data/curriculum';

interface ArenaAndSquadsProps {
  onOpenLecture: (lectureId: string) => void;
}

type ArenaTab = 'reels' | 'tree' | 'duels' | 'squads';

const DUEL_QUESTIONS = [
  {
    q: 'If temperature increases in a pure intrinsic Silicon wafer, what happens to its electrical conductivity?',
    options: ['Decreases due to lattice scattering', 'Increases exponentially as more covalent bonds break', 'Remains strictly constant'],
    ans: 1,
  },
  {
    q: 'At the highest point of an oblique projectile (launch angle 45°), what is the net acceleration?',
    options: ['Zero', 'g downward', 'g cos 45° horizontal'],
    ans: 1,
  },
  {
    q: 'Which dopant creates free donor electrons in Silicon?',
    options: ['Boron (Group 13)', 'Gallium (Group 13)', 'Phosphorus (Group 15)'],
    ans: 2,
  },
];

export const ArenaAndSquads: React.FC<ArenaAndSquadsProps> = ({ onOpenLecture }) => {
  const [tab, setTab] = useState<ArenaTab>('reels');

  // Concept Reels & Stories
  const [reelIndex, setReelIndex] = useState(0);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [savedReels, setSavedReels] = useState<Record<string, boolean>>({});
  const [activeStoryId, setActiveStoryId] = useState(STORIES_DATA[0].id);
  const [storyAnswer, setStoryAnswer] = useState<number | null>(null);
  const [playingPodcastId, setPlayingPodcastId] = useState<string | null>(null);

  // RPG Skill Tree
  const [selectedNodeId, setSelectedNodeId] = useState('sk-3');

  // Blitz Duels & Boss Battle
  const [duelOptOut, setDuelOptOut] = useState(false);
  const [duelRunning, setDuelRunning] = useState(false);
  const [duelTimeLeft, setDuelTimeLeft] = useState(90);
  const [duelQIdx, setDuelQIdx] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [eloRating, setEloRating] = useState(1420);

  // Boss Battle Mock
  const [bossHp, setBossHp] = useState(100);
  const [comboStreak, setComboStreak] = useState(0);
  const [bossLog, setBossLog] = useState('Answer conceptually to deal damage to the Silicon Guardian.');

  // Study Squads & Rescue Quiz
  const [squadMultiplier, setSquadMultiplier] = useState(1.5);
  const [rescueNeeded, setRescueNeeded] = useState(true);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoSec, setPomoSec] = useState(25 * 60);

  // Discord-like Community messages
  const [activeChannel, setActiveChannel] = useState('#physics-semiconductors');
  const [channelMsg, setChannelMsg] = useState('');
  const [communityPosts, setCommunityPosts] = useState<
    Array<{ id: string; channel: string; author: string; text: string; time: string }>
  >([
    {
      id: 'c1',
      channel: '#physics-semiconductors',
      author: 'Diya (Squad Mate)',
      text: 'Remember: depletion region has zero free carriers—only fixed donor/acceptor ions.',
      time: '10:05 AM',
    },
    {
      id: 'c2',
      channel: '#physics-semiconductors',
      author: 'Rohan (Class 12)',
      text: 'Just solved the Cliff Projectile trap puzzle! Always check whether landing height equals launch height.',
      time: '10:22 AM',
    },
    {
      id: 'c3',
      channel: '#jee-doubts',
      author: 'Kabir',
      text: 'Anyone reviewing Mass Action Law for tonight’s 2-day mentor recall?',
      time: '11:02 AM',
    },
  ]);

  useEffect(() => {
    if (!duelRunning) return;
    const id = window.setInterval(() => {
      setDuelTimeLeft((t) => {
        if (t <= 1) {
          setDuelRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [duelRunning]);

  useEffect(() => {
    if (!pomoRunning) return;
    const id = window.setInterval(() => {
      setPomoSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [pomoRunning]);

  const reel = CONCEPT_REELS_DATA[reelIndex];
  const story = STORIES_DATA.find((s) => s.id === activeStoryId) || STORIES_DATA[0];
  const selectedNode = INITIAL_SKILL_TREE.find((n) => n.id === selectedNodeId) || INITIAL_SKILL_TREE[0];

  const handleDuelAnswer = (idx: number) => {
    const q = DUEL_QUESTIONS[duelQIdx % DUEL_QUESTIONS.length];
    if (idx === q.ans) {
      setPlayerScore((s) => s + 10);
      setEloRating((e) => e + 12);
    } else {
      setOpponentScore((s) => s + 10);
    }
    if (duelQIdx + 1 >= DUEL_QUESTIONS.length) {
      setDuelRunning(false);
    } else {
      setDuelQIdx((i) => i + 1);
    }
  };

  const handleBossAttack = (isCorrect: boolean) => {
    if (isCorrect) {
      const nextCombo = comboStreak + 1;
      const dmg = nextCombo >= 2 ? 35 : 25;
      setComboStreak(nextCombo);
      setBossHp((hp) => Math.max(0, hp - dmg));
      setBossLog(`Critical Hit (${nextCombo}x streak)! Dealt ${dmg} HP conceptual damage.`);
    } else {
      setComboStreak(0);
      setBossLog('Missed concept check—streak reset. Revisit Mass Action Law in Recall Lab.');
    }
  };

  const handlePostCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelMsg.trim()) return;
    setCommunityPosts((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        channel: activeChannel,
        author: 'Aarav (You)',
        text: channelMsg.trim(),
        time: 'Just now',
      },
    ]);
    setChannelMsg('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#dccfb4] dark:border-[#c3a47b]/20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#29251d] dark:text-[#eee2ca]">
            Concept Reels, Skill Trees, Duels &amp; Squads
          </h1>
          <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5">
            Engaging micro-discovery and peer accountability designed around weak-concept mastery—never infinite scrolling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-lg">
          {(
            [
              ['reels', 'Reels, Stories & Audio'],
              ['tree', 'RPG Skill Tree'],
              ['duels', 'Blitz Duels & Boss'],
              ['squads', 'Squads & Community'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                tab === id
                  ? 'bg-[#29251d] text-[#eee2ca] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                  : 'text-[#5e5240] dark:text-[#c5b79e] hover:text-[#29251d] dark:hover:text-[#eee2ca]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Concept Reels + 24-Hour Stories + Commute Podcast Mode */}
      {tab === 'reels' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Concept Reels Feed */}
          <div className="lg:col-span-5 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-[#5e5240] dark:text-[#c5b79e] mb-3">
              <span>Concept Reels · {reel.durationSec}s</span>
              <span>{reel.weakTopicMatch ? 'Prioritized for Weak Topic' : 'Syllabus Highlight'}</span>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-[#1d1a15] border border-[#c3a47b]/25 aspect-[4/5] max-h-[420px] mx-auto">
              <img
                src={reel.visual}
                alt={reel.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1d1a15]/95 via-[#1d1a15]/40 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4 text-[#eee2ca] space-y-2">
                <div className="text-xs text-[#dbc39c] font-medium">{reel.subject}</div>
                <h3 className="text-base font-bold leading-snug">{reel.title}</h3>
                <p className="text-xs text-[#c5b79e] leading-relaxed">{reel.keyTakeaway}</p>
                <div className="text-[11px] text-[#dbc39c]">
                  Exam Trap: {reel.examTrap}
                </div>
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenLecture(reel.linkedLectureId)}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#c3a47b] hover:bg-[#dbc39c] text-[#1d1a15] rounded-lg cursor-pointer"
                  >
                    Open Full 18-Min Lecture
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setLikedReels((p) => ({ ...p, [reel.id]: !p[reel.id] }))
                      }
                      aria-label="Like reel"
                      className={`p-2 rounded-lg border border-[#eee2ca]/25 cursor-pointer ${
                        likedReels[reel.id] ? 'bg-[#a96346] text-[#fbf6ea]' : 'bg-[#1d1a15]/60 text-[#eee2ca]'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSavedReels((p) => ({ ...p, [reel.id]: !p[reel.id] }))
                      }
                      aria-label="Save reel"
                      className={`p-2 rounded-lg border border-[#eee2ca]/25 cursor-pointer ${
                        savedReels[reel.id] ? 'bg-[#c3a47b] text-[#1d1a15]' : 'bg-[#1d1a15]/60 text-[#eee2ca]'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setReelIndex((i) => (i - 1 + CONCEPT_REELS_DATA.length) % CONCEPT_REELS_DATA.length)
                }
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer"
              >
                Previous Reel
              </button>
              <span className="text-xs font-mono tabular-nums text-[#5e5240] dark:text-[#c5b79e]">
                {reelIndex + 1} / {CONCEPT_REELS_DATA.length} (Bounded Feed)
              </span>
              <button
                type="button"
                onClick={() => setReelIndex((i) => (i + 1) % CONCEPT_REELS_DATA.length)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] cursor-pointer"
              >
                Next Reel
              </button>
            </div>
          </div>

          {/* 24-Hour Teacher Stories + Audio Commute Mode */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
                <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  24-Hour Teacher &amp; AI Mentor Stories
                </h2>
                <span className="text-xs text-[#5e5240] dark:text-[#c5b79e]">Disappears in 24h unless saved</span>
              </div>

              <div className="flex gap-3 mt-4 flex-wrap">
                {STORIES_DATA.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setActiveStoryId(st.id);
                      setStoryAnswer(null);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left cursor-pointer ${
                      activeStoryId === st.id
                        ? 'border-[#8b673c] dark:border-[#c3a47b] bg-[#eadfc7] dark:bg-[#343025]'
                        : 'border-[#dccfb4] dark:border-[#c3a47b]/20'
                    }`}
                  >
                    <img
                      src={st.avatar}
                      alt={st.creator}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-[#29251d] dark:text-[#eee2ca]">{st.creator}</div>
                      <div className="text-[#5e5240] dark:text-[#c5b79e]">{st.type} · {st.expiresIn}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 p-4 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 space-y-3">
                <div className="text-sm font-medium text-[#29251d] dark:text-[#eee2ca]">
                  {story.question}
                </div>
                <div className="flex flex-wrap gap-2">
                  {story.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStoryAnswer(idx)}
                      className={`px-3 py-1.5 text-xs rounded-lg border cursor-pointer ${
                        storyAnswer === idx
                          ? idx === story.correctIdx
                            ? 'border-[#5f684f] dark:border-[#89946f] bg-[#5f684f]/15 dark:bg-[#89946f]/20 text-[#29251d] dark:text-[#eee2ca]'
                            : 'border-[#a96346] dark:border-[#d98c6e] bg-[#a96346]/15 dark:bg-[#a96346]/25 text-[#945a3e] dark:text-[#f2c4b3]'
                          : 'border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {storyAnswer !== null && (
                  <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] pt-1">
                    {story.tip}
                  </p>
                )}
              </div>
            </div>

            {/* Audio-First Podcast & Commute Mode */}
            <div className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
              <div className="flex items-center gap-2 pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
                <Headphones className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b]" />
                <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  Audio-First Commute &amp; Podcast Revision
                </h2>
              </div>
              <div className="divide-y divide-[#e5d9bf] dark:divide-[#c3a47b]/15 mt-2">
                {PODCAST_EPISODES.map((ep) => {
                  const playing = playingPodcastId === ep.id;
                  return (
                    <div key={ep.id} className="py-3.5 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                          {ep.category} · {ep.duration}
                        </div>
                        <div className="text-sm font-medium text-[#29251d] dark:text-[#eee2ca] mt-0.5">
                          {ep.title}
                        </div>
                        <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-1">
                          {ep.scriptSummary}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlayingPodcastId(playing ? null : ep.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#29251d] dark:text-[#eee2ca] hover:bg-[#eadfc7] dark:hover:bg-[#343025] shrink-0 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {playing ? 'Playing Audio' : 'Listen'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RPG Concept Skill Tree */}
      {tab === 'tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#29251d] dark:text-[#eee2ca]">
              Physics Prerequisite Skill Tree
            </h2>
            <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] mt-0.5 mb-6">
              Foundational concepts must reach mastery before advanced nodes unlock.
            </p>

            <div className="space-y-4">
              {INITIAL_SKILL_TREE.map((node, idx) => (
                <div key={node.id} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full max-w-md p-4 rounded-xl border text-left transition-colors flex items-center justify-between gap-4 cursor-pointer ${
                      selectedNodeId === node.id
                        ? 'border-[#8b673c] dark:border-[#c3a47b] ring-1 ring-[#c3a47b]/40 bg-[#eadfc7] dark:bg-[#343025]'
                        : node.status === 'locked'
                        ? 'border-[#dccfb4] dark:border-[#c3a47b]/15 bg-[#f4ecd8] dark:bg-[#1d1a15] opacity-75'
                        : 'border-[#dccfb4] dark:border-[#c3a47b]/20 bg-[#fbf6ea] dark:bg-[#211e18]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {node.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-[#5f684f] dark:text-[#89946f] shrink-0" />
                      ) : node.status === 'locked' ? (
                        <Lock className="w-5 h-5 text-[#8c7e6a] dark:text-[#c5b79e]/60 shrink-0" />
                      ) : (
                        <Play className="w-5 h-5 text-[#8b673c] dark:text-[#c3a47b] shrink-0" />
                      )}
                      <div>
                        <div className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                          Tier {node.tier} · {node.status.toUpperCase()}
                        </div>
                        <div className="text-sm font-semibold text-[#29251d] dark:text-[#eee2ca]">
                          {node.title}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-mono tabular-nums font-bold text-[#29251d] dark:text-[#eee2ca]">
                      {node.masteryPercent}%
                    </div>
                  </button>
                  {idx < INITIAL_SKILL_TREE.length - 1 && (
                    <div className="h-5 w-px bg-[#dccfb4] dark:bg-[#c3a47b]/30" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6 space-y-4">
            <div className="text-xs text-[#5e5240] dark:text-[#c5b79e]">Selected Concept Node</div>
            <h3 className="text-lg font-bold text-[#29251d] dark:text-[#eee2ca]">
              {selectedNode.title}
            </h3>
            <div className="text-xs text-[#5e5240] dark:text-[#c5b79e] space-y-2">
              <p>Status: <strong className="capitalize text-[#29251d] dark:text-[#eee2ca]">{selectedNode.status}</strong></p>
              <p>Current Mastery: <strong className="font-mono tabular-nums text-[#29251d] dark:text-[#eee2ca]">{selectedNode.masteryPercent}%</strong></p>
              <p>
                {selectedNode.status === 'locked'
                  ? 'Complete prerequisite tier quiz with >= 75% mastery to unlock this node.'
                  : 'Launch the corresponding 20-minute micro-lecture or recall check.'}
              </p>
            </div>
            {selectedNode.status !== 'locked' && (
              <button
                type="button"
                onClick={() => onOpenLecture('lec-mech-1')}
                className="w-full px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg cursor-pointer"
              >
                Study Node Micro-Lecture
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: 1v1 Ranked Blitz Duels + Boss-Battle Mock Test */}
      {tab === 'duels' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 1v1 Blitz Duel */}
          <div className="lg:col-span-6 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b]" />
                <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  1v1 Ranked Blitz Duel (90s)
                </h2>
              </div>
              <label className="flex items-center gap-2 text-xs text-[#5e5240] dark:text-[#c5b79e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={duelOptOut}
                  onChange={(e) => {
                    setDuelOptOut(e.target.checked);
                    if (e.target.checked) setDuelRunning(false);
                  }}
                  className="accent-[#8b673c] dark:accent-[#c3a47b]"
                />
                Opt out of competitive duels
              </label>
            </div>

            {duelOptOut ? (
              <p className="py-8 text-xs text-[#5e5240] dark:text-[#c5b79e]">
                Competitive matchmaking is paused. You can continue solo spaced-repetition and Boss-Battle practice anytime.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono tabular-nums p-3 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 text-[#29251d] dark:text-[#eee2ca]">
                  <span>You: {playerScore} pts ({eloRating} ELO)</span>
                  <span>{duelTimeLeft}s</span>
                  <span>Peer Match: {opponentScore} pts (1415 ELO)</span>
                </div>

                {!duelRunning ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDuelTimeLeft(90);
                      setDuelQIdx(0);
                      setPlayerScore(0);
                      setOpponentScore(0);
                      setDuelRunning(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg cursor-pointer"
                  >
                    Start 90-Second Conceptual Match
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-[#29251d] dark:text-[#eee2ca]">
                      {DUEL_QUESTIONS[duelQIdx % DUEL_QUESTIONS.length].q}
                    </div>
                    <div className="space-y-2">
                      {DUEL_QUESTIONS[duelQIdx % DUEL_QUESTIONS.length].options.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleDuelAnswer(idx)}
                          className="w-full text-left p-3 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 hover:border-[#8b673c] dark:hover:border-[#c3a47b] text-[#29251d] dark:text-[#eee2ca] cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Boss-Battle Mock Test */}
          <div className="lg:col-span-6 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              <div>
                <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  Boss Battle: The Silicon Barrier Guardian
                </h2>
                <p className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                  End-of-chapter multi-stage check · Consecutive correct answers trigger critical hits.
                </p>
              </div>
              <span className="font-mono text-xs tabular-nums font-bold text-[#945a3e] dark:text-[#d98c6e]">
                Boss HP: {bossHp}%
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="h-2.5 w-full bg-[#eadfc7] dark:bg-[#343025] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#a96346] transition-all duration-200"
                  style={{ width: `${bossHp}%` }}
                />
              </div>

              <div className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                Streak Combo: <strong className="font-mono text-[#29251d] dark:text-[#eee2ca]">{comboStreak}x</strong> · {bossLog}
              </div>

              {bossHp > 0 ? (
                <div className="p-4 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 space-y-3">
                  <div className="text-sm font-medium text-[#29251d] dark:text-[#eee2ca]">
                    Stage Check: Why does reverse saturation current I₀ stay nearly independent of reverse voltage before breakdown?
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleBossAttack(true)}
                      className="w-full text-left p-2.5 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 hover:border-[#8b673c] dark:hover:border-[#c3a47b] text-[#29251d] dark:text-[#eee2ca] cursor-pointer"
                    >
                      Because I₀ is limited by the fixed thermal generation rate of minority carriers.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBossAttack(false)}
                      className="w-full text-left p-2.5 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 hover:border-[#8b673c] dark:hover:border-[#c3a47b] text-[#29251d] dark:text-[#eee2ca] cursor-pointer"
                    >
                      Because majority carrier diffusion increases to cancel reverse voltage.
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#5f684f]/15 dark:bg-[#89946f]/20 border border-[#5f684f]/40 dark:border-[#89946f]/40 text-xs text-[#29251d] dark:text-[#eee2ca] flex items-center justify-between">
                  <span>Boss Defeated! Chapter mastery verified.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBossHp(100);
                      setComboStreak(0);
                    }}
                    className="underline font-medium cursor-pointer"
                  >
                    Replay Stage
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Study Squads + Live Study With Me + Discord Community */}
      {tab === 'squads' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 4-Student Study Squad + Rescue Quiz */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b]" />
                  <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                    Study Squad (4 Members)
                  </h2>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-[#8b673c] dark:text-[#c3a47b]">
                  {squadMultiplier.toFixed(1)}x Multiplier
                </span>
              </div>

              <div className="divide-y divide-[#e5d9bf] dark:divide-[#c3a47b]/15 mt-2 text-xs">
                {[
                  { name: 'Aarav (You)', goal: '45 / 45 min today', status: 'Completed' },
                  { name: 'Diya M.', goal: '60 / 60 min today', status: 'Completed' },
                  { name: 'Rohan K.', goal: '30 / 30 min today', status: 'Completed' },
                  { name: 'Kabir S.', goal: '10 / 45 min today', status: rescueNeeded ? 'Needs Rescue' : 'Rescued' },
                ].map((m) => (
                  <div key={m.name} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#29251d] dark:text-[#eee2ca]">{m.name}</div>
                      <div className="text-[#5e5240] dark:text-[#c5b79e] tabular-nums">{m.goal}</div>
                    </div>
                    <span className={m.status === 'Needs Rescue' ? 'text-[#945a3e] dark:text-[#d98c6e] font-medium' : 'text-[#5f684f] dark:text-[#89946f] font-medium'}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>

              {rescueNeeded && (
                <div className="mt-4 p-3.5 rounded-lg bg-[#eadfc7] dark:bg-[#343025] border border-[#945a3e]/35 dark:border-[#c3a47b]/30 text-xs space-y-2">
                  <p className="text-[#29251d] dark:text-[#eee2ca]">
                    Supportive Accountability: Kabir missed today’s goal, temporarily lowering the squad multiplier. Complete a quick 1-question Rescue Quiz to restore it to 2.0x!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setRescueNeeded(false);
                      setSquadMultiplier(2.0);
                    }}
                    className="px-3 py-1.5 font-semibold text-[#fbf6ea] bg-[#945a3e] hover:bg-[#7d4930] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-md cursor-pointer"
                  >
                    Pass Rescue Quiz &amp; Restore 2.0x
                  </button>
                </div>
              )}
            </div>

            {/* Live Study With Me Pomodoro Library */}
            <div className="bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
                <h3 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  Live Study With Me · Quiet Library
                </h3>
                <span className="text-xs text-[#5e5240] dark:text-[#c5b79e] tabular-nums">18 peers studying</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-3xl font-mono font-bold tabular-nums text-[#29251d] dark:text-[#eee2ca]">
                  {String(Math.floor(pomoSec / 60)).padStart(2, '0')}:
                  {String(pomoSec % 60).padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={() => setPomoRunning((p) => !p)}
                  className="px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg cursor-pointer"
                >
                  {pomoRunning ? 'Pause Sync Timer' : 'Join Quiet Pomodoro'}
                </button>
              </div>
            </div>
          </div>

          {/* Discord-Style Moderated Community */}
          <div className="lg:col-span-7 bg-[#fbf6ea] dark:bg-[#211e18] border border-[#dccfb4] dark:border-[#c3a47b]/20 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b]" />
                <h2 className="text-base font-semibold text-[#29251d] dark:text-[#eee2ca]">
                  Moderated Subject Community
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-[#5e5240] dark:text-[#c5b79e]">
                <Shield className="w-3.5 h-3.5 text-[#8b673c] dark:text-[#c3a47b]" />
                Under-18 Safe Moderation Active
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {['#physics-semiconductors', '#jee-doubts', '#study-resources'].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setActiveChannel(ch)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg border cursor-pointer ${
                    activeChannel === ch
                      ? 'bg-[#8b673c] text-[#fbf6ea] border-[#8b673c] dark:bg-[#c3a47b] dark:text-[#1d1a15] dark:border-[#c3a47b]'
                      : 'border-[#d6c8ab] dark:border-[#c3a47b]/25 text-[#5e5240] dark:text-[#c5b79e]'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2.5 max-h-64 overflow-y-auto">
              {communityPosts
                .filter((p) => p.channel === activeChannel)
                .map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg bg-[#f4ecd8] dark:bg-[#1d1a15] border border-[#dccfb4] dark:border-[#c3a47b]/20 text-xs"
                  >
                    <div className="flex items-center justify-between text-[#5e5240] dark:text-[#c5b79e] mb-1">
                      <span className="font-semibold text-[#29251d] dark:text-[#eee2ca]">{p.author}</span>
                      <div className="flex items-center gap-2">
                        <span>{p.time}</span>
                        <button
                          type="button"
                          title="Report message to moderators"
                          className="text-[#8c7e6a] hover:text-[#945a3e] dark:hover:text-[#d98c6e] cursor-pointer"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[#29251d] dark:text-[#eee2ca]">{p.text}</p>
                  </div>
                ))}
            </div>

            <form onSubmit={handlePostCommunity} className="mt-4 flex gap-2">
              <input
                type="text"
                value={channelMsg}
                onChange={(e) => setChannelMsg(e.target.value)}
                placeholder={`Share a peer explanation in ${activeChannel}...`}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#d6c8ab] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca]"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] rounded-lg cursor-pointer"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
