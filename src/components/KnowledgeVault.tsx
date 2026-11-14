import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  FileText,
  Globe,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  LEARNING_PLATFORMS,
  OFFLINE_WIKI_FALLBACK,
  TRACK_CONFIG,
} from '../data/ecosystem';
import type { ExamTrack, Flashcard } from '../types/mindforge';

interface KnowledgeVaultProps {
  track: ExamTrack;
  initialQuery?: string;
  onAddFlashcards: (cards: Flashcard[], sourceTitle: string) => void;
  onJumpToRecall: () => void;
}

interface WikiSummaryState {
  title: string;
  description: string;
  extract: string;
  url: string;
  thumbnail?: string;
}

interface OpenAlexPaper {
  title: string;
  year: string | number;
  citations: number;
  authors: string;
  link: string;
}

export const KnowledgeVault: React.FC<KnowledgeVaultProps> = ({
  track,
  initialQuery,
  onAddFlashcards,
  onJumpToRecall,
}) => {
  const cfg = TRACK_CONFIG[track];
  const [query, setQuery] = useState(initialQuery || cfg.quickWikiTopics[0]);
  const [wikiStatus, setWikiStatus] = useState<'loading' | 'live' | 'cached'>('live');
  const [wiki, setWiki] = useState<WikiSummaryState>(
    OFFLINE_WIKI_FALLBACK[cfg.quickWikiTopics[0]] || OFFLINE_WIKI_FALLBACK.Semiconductor
  );
  const [relatedConcepts, setRelatedConcepts] = useState<string[]>([]);
  const [papers, setPapers] = useState<OpenAlexPaper[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);

  const [omniTopic, setOmniTopic] = useState(
    track === 'jee' ? 'Rotational Motion' : track === 'neet' ? 'Cardiac Cycle' : 'Article 368'
  );
  const [platformCat, setPlatformCat] = useState<'all' | 'govt' | 'jeeneet' | 'upsc'>('all');
  const [flashcardBanner, setFlashcardBanner] = useState<string | null>(null);

  const fetchKnowledge = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setWikiStatus('loading');
    setPapersLoading(true);
    setFlashcardBanner(null);

    // 1. Live Wikipedia OpenSearch + Summary REST
    try {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(trimmed)}&limit=6&format=json&origin=*`
      );
      const searchData = await searchRes.json();
      const bestTitle = searchData?.[1]?.[0] || trimmed;
      const related: string[] = Array.isArray(searchData?.[1]) ? searchData[1] : [];
      setRelatedConcepts(related);

      const sumRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`
      );
      if (!sumRes.ok) throw new Error('Summary unavailable');
      const sumData = await sumRes.json();

      setWiki({
        title: sumData.title || bestTitle,
        description: sumData.description || 'Encyclopedic Concept Entry',
        extract: sumData.extract || 'Summary retrieved from Wikipedia.',
        url:
          sumData.content_urls?.desktop?.page ||
          `https://en.wikipedia.org/wiki/${encodeURIComponent(bestTitle)}`,
        thumbnail: sumData.thumbnail?.source,
      });
      setWikiStatus('live');
    } catch {
      const fb = OFFLINE_WIKI_FALLBACK[trimmed] || {
        title: trimmed,
        description: 'Verified Conceptual Reference',
        extract: `Comprehensive study synthesis for ${trimmed}. Connect this topic with NCERT fundamentals, past-year examination questions, and first-principles derivations.`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(trimmed)}`,
      };
      setWiki(fb);
      setRelatedConcepts([]);
      setWikiStatus('cached');
    }

    // 2. Live OpenAlex Scholarly Works
    try {
      const oaRes = await fetch(
        `https://api.openalex.org/works?search=${encodeURIComponent(trimmed)}&per-page=4`
      );
      const oaData = await oaRes.json();
      const works = Array.isArray(oaData?.results) ? oaData.results : [];
      setPapers(
        works.map((w: any) => ({
          title: w.title || 'Scholarly Work',
          year: w.publication_year || 'N/A',
          citations: w.cited_by_count ?? 0,
          authors:
            (w.authorships || [])
              .slice(0, 2)
              .map((a: any) => a.author?.display_name)
              .filter(Boolean)
              .join(', ') || 'Academic Consortium',
          link: w.doi || w.id || '#',
        }))
      );
    } catch {
      setPapers([]);
    } finally {
      setPapersLoading(false);
    }
  };

  useEffect(() => {
    const defaultTopic = initialQuery || cfg.quickWikiTopics[0];
    setQuery(defaultTopic);
    setOmniTopic(
      track === 'jee' ? 'Rotational Motion' : track === 'neet' ? 'Cardiac Cycle' : 'Article 368'
    );
    void fetchKnowledge(defaultTopic);
  }, [track, initialQuery]);

  const handleGenerateFlashcards = () => {
    const sentences = wiki.extract.split('. ').filter((s) => s.length > 25);
    const now = Date.now();
    const generated: Flashcard[] = [
      {
        id: `fc-wiki-1-${now}`,
        subtopicTitle: wiki.title,
        category: 'Definition',
        front: `Define "${wiki.title}" (${wiki.description})`,
        back: sentences[0] ? `${sentences[0]}.` : wiki.extract,
      },
      {
        id: `fc-wiki-2-${now}`,
        subtopicTitle: wiki.title,
        category: 'Concept',
        front: `Key mechanism / exam insight for ${wiki.title}:`,
        back: sentences[1] ? `${sentences[1]}.` : wiki.extract,
      },
    ];
    onAddFlashcards(generated, wiki.title);
    setFlashcardBanner(`Generated 2 Flashcards from "${wiki.title}" (+30 XP) into your Recall Deck.`);
  };

  const launchOmniPlatform = (
    platform: 'khan' | 'nptel' | 'phet' | 'pw' | 'drishti' | 'youtube' | 'pubmed' | 'wiki'
  ) => {
    const encoded = encodeURIComponent(omniTopic.trim() || 'Physics');
    const urls: Record<string, string> = {
      khan: `https://www.khanacademy.org/search?page_search_query=${encoded}`,
      nptel: `https://www.google.com/search?q=site:nptel.ac.in+${encoded}`,
      phet: `https://phet.colorado.edu/en/simulations/filter?subjects=physics,math,chemistry&type=html&q=${encoded}`,
      pw: `https://www.youtube.com/results?search_query=Physics+Wallah+${encoded}`,
      drishti: `https://www.drishtiias.com/search?q=${encoded}`,
      youtube: `https://www.youtube.com/results?search_query=${encoded}+lecture`,
      pubmed: `https://pubmed.ncbi.nlm.nih.gov/?term=${encoded}`,
      wiki: `https://en.wikipedia.org/w/index.php?search=${encoded}`,
    };
    window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  const filteredPlatforms =
    platformCat === 'all'
      ? LEARNING_PLATFORMS
      : LEARNING_PLATFORMS.filter((p) => p.cat === platformCat);

  return (
    <div className="space-y-6">
      {/* Universal World Knowledge Vault Search Header */}
      <section className="rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-[#8b673c] dark:text-[#c3a47b]">
              <Globe className="w-3.5 h-3.5" />
              Live Encyclopedic + Peer-Reviewed Research Engine
            </div>
            <h1 className="text-2xl font-bold text-[#29251d] dark:text-[#eee2ca]">
              Universal World Knowledge Vault
            </h1>
            <p className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
              Queries live Wikipedia REST &amp; OpenSearch APIs alongside OpenAlex scholarly papers
              and converts any concept into active-recall flashcards in one click.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cfg.quickWikiTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  setQuery(topic);
                  void fetchKnowledge(topic);
                }}
                className="px-2.5 py-1 rounded-full border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[11px] font-medium text-[#29251d] dark:text-[#eee2ca] hover:border-[#8b673c] dark:hover:border-[#c3a47b] transition-colors cursor-pointer"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void fetchKnowledge(query);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8b673c] dark:text-[#c3a47b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter any concept in physics, biology, polity, chemistry, or world affairs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-sm text-[#29251d] dark:text-[#eee2ca] placeholder:text-[#7c6e58] focus:outline-none focus:border-[#8b673c] dark:focus:border-[#c3a47b]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg font-semibold text-xs text-[#fbf6ea] bg-[#8b673c] hover:bg-[#775631] dark:text-[#1d1a15] dark:bg-[#c3a47b] dark:hover:bg-[#dbc39c] transition-colors cursor-pointer shrink-0"
          >
            Fetch World Knowledge
          </button>
        </form>

        {relatedConcepts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#5e5240] dark:text-[#c5b79e]">
              Related Concepts:
            </span>
            {relatedConcepts.map((rt) => (
              <button
                key={rt}
                type="button"
                onClick={() => {
                  setQuery(rt);
                  void fetchKnowledge(rt);
                }}
                className="px-2.5 py-0.5 rounded border border-[#dccfb4] dark:border-[#c3a47b]/20 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[11px] text-[#29251d] dark:text-[#eee2ca] hover:border-[#8b673c] dark:hover:border-[#c3a47b] cursor-pointer"
              >
                {rt}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Two-Column Wikipedia Summary + OpenAlex Research */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#8b673c]/15 dark:bg-[#c3a47b]/15 text-[#8b673c] dark:text-[#c3a47b]">
                Wikipedia Live API
              </span>
              <span className="text-[11px] font-mono text-[#5f684f] dark:text-[#89946f]">
                {wikiStatus === 'loading'
                  ? 'Querying...'
                  : wikiStatus === 'live'
                  ? 'Live Synced'
                  : 'Cached Reference'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleGenerateFlashcards}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#fbf6ea] bg-[#5f684f] hover:bg-[#4f5841] dark:text-[#1d1a15] dark:bg-[#89946f] dark:hover:bg-[#9aa680] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Generate Flashcards
            </button>
          </div>

          {flashcardBanner && (
            <div className="p-3 rounded-lg border border-[#5f684f]/40 dark:border-[#89946f]/40 bg-[#5f684f]/10 dark:bg-[#89946f]/10 text-xs text-[#3b4230] dark:text-[#c6d1ae] flex flex-wrap items-center justify-between gap-2">
              <span>{flashcardBanner}</span>
              <button
                type="button"
                onClick={onJumpToRecall}
                className="underline font-semibold text-[#29251d] dark:text-[#eee2ca] cursor-pointer"
              >
                Open Flashcards →
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {wiki.thumbnail && (
              <img
                src={wiki.thumbnail}
                alt={wiki.title}
                className="w-28 h-28 object-cover rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 shrink-0"
              />
            )}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#29251d] dark:text-[#eee2ca]">
                {wiki.title}
              </h2>
              <p className="text-xs font-semibold text-[#8b673c] dark:text-[#c3a47b]">
                {wiki.description}
              </p>
              <p className="text-sm leading-relaxed text-[#463d2e] dark:text-[#d5cab3]">
                {wiki.extract}
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <a
                  href={wiki.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-xs font-semibold text-[#29251d] dark:text-[#eee2ca] hover:border-[#8b673c] dark:hover:border-[#c3a47b]"
                >
                  Read Full Wikipedia Entry
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={onJumpToRecall}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#5f684f]/35 dark:border-[#89946f]/35 bg-[#5f684f]/10 dark:bg-[#89946f]/15 text-xs font-semibold text-[#474e3b] dark:text-[#b6c29d] cursor-pointer"
                >
                  Practice Recall Deck →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* OpenAlex Peer-Reviewed Research Papers */}
        <div className="lg:col-span-5 rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#e5d9bf] dark:border-[#c3a47b]/15">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b673c] dark:text-[#c3a47b]">
                OpenAlex Scholarly Index
              </span>
              <h3 className="font-bold text-base text-[#29251d] dark:text-[#eee2ca]">
                Peer-Reviewed Research Papers
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#5e5240] dark:text-[#c5b79e]">
              250M+ Works
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {papersLoading ? (
              <p className="text-xs font-mono text-[#5e5240] dark:text-[#c5b79e]">
                Querying OpenAlex scholarly repository...
              </p>
            ) : papers.length === 0 ? (
              <p className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
                No direct OpenAlex works matched. Try a broader scientific or policy keyword.
              </p>
            ) : (
              papers.map((p, idx) => (
                <div
                  key={`${p.title}-${idx}`}
                  className="p-3.5 rounded-lg border border-[#e5d9bf] dark:border-[#c3a47b]/15 bg-[#f4ecd8] dark:bg-[#1d1a15] space-y-1"
                >
                  <div className="flex justify-between text-[11px] font-mono text-[#8b673c] dark:text-[#c3a47b]">
                    <span>Year: {p.year}</span>
                    <span>Citations: {p.citations}</span>
                  </div>
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#29251d] dark:text-[#eee2ca] hover:text-[#8b673c] dark:hover:text-[#c3a47b] inline-flex items-start gap-1 leading-snug"
                  >
                    <span>{p.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
                  </a>
                  <p className="text-[11px] text-[#5e5240] dark:text-[#c5b79e] truncate">
                    {p.authors}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Omni-Platform Topic Deep-Link Launcher */}
      <section className="rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] p-6 space-y-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b673c] dark:text-[#c3a47b]">
            Cross-Platform Deep-Link Launcher
          </span>
          <h2 className="text-xl font-bold text-[#29251d] dark:text-[#eee2ca]">
            Search Any Topic Across Major Studying Platforms
          </h2>
          <p className="text-xs text-[#5e5240] dark:text-[#c5b79e]">
            Enter a chapter once and launch targeted searches directly on Khan Academy, NPTEL, PhET,
            Physics Wallah, Drishti IAS, YouTube, PubMed, or Wikipedia.
          </p>
        </div>

        <input
          type="text"
          value={omniTopic}
          onChange={(e) => setOmniTopic(e.target.value)}
          placeholder="e.g., Rotational Motion, Cardiac Cycle, Article 368, Thermodynamics..."
          className="w-full px-4 py-2.5 rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-sm text-[#29251d] dark:text-[#eee2ca] focus:outline-none focus:border-[#8b673c] dark:focus:border-[#c3a47b]"
        />

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {(
            [
              ['khan', 'Khan Academy'],
              ['nptel', 'NPTEL IIT'],
              ['phet', 'PhET Simulations'],
              ['pw', 'Physics Wallah'],
              ['drishti', 'Drishti IAS'],
              ['youtube', 'YouTube Lectures'],
              ['pubmed', 'PubMed Medical'],
              ['wiki', 'Wikipedia'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => launchOmniPlatform(key)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#29251d] dark:text-[#eee2ca] hover:border-[#8b673c] dark:hover:border-[#c3a47b] cursor-pointer"
            >
              <span>{label}</span>
              <ExternalLink className="w-3 h-3 text-[#8b673c] dark:text-[#c3a47b]" />
            </button>
          ))}
        </div>
      </section>

      {/* 25 Verified Studying & Exam Ecosystems */}
      <section className="rounded-xl border border-[#dccfb4] dark:border-[#c3a47b]/25 bg-[#fbf6ea] dark:bg-[#211e18] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8b673c] dark:text-[#c3a47b]">
              <BookOpen className="w-3.5 h-3.5" />
              Verified External Gateways
            </div>
            <h2 className="text-lg font-bold text-[#29251d] dark:text-[#eee2ca]">
              25 Connected Studying &amp; Exam Ecosystems
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            {(
              [
                ['all', 'All (25)'],
                ['govt', 'Govt & Exam Bodies (10)'],
                ['jeeneet', 'JEE & NEET (9)'],
                ['upsc', 'UPSC & OpenCourseWare (6)'],
              ] as const
            ).map(([cat, label]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setPlatformCat(cat)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  platformCat === cat
                    ? 'bg-[#8b673c] text-[#fbf6ea] dark:bg-[#c3a47b] dark:text-[#1d1a15]'
                    : 'bg-[#f4ecd8] dark:bg-[#1d1a15] text-[#5e5240] dark:text-[#c5b79e] border border-[#dccfb4] dark:border-[#c3a47b]/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlatforms.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-[#e5d9bf] dark:border-[#c3a47b]/15 bg-[#f4ecd8] dark:bg-[#1d1a15] hover:border-[#8b673c] dark:hover:border-[#c3a47b] transition-colors flex flex-col justify-between space-y-2 group"
            >
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8b673c] dark:text-[#c3a47b]">
                    {p.tag}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#5e5240] dark:text-[#c5b79e] group-hover:text-[#8b673c] dark:group-hover:text-[#c3a47b]" />
                </div>
                <h3 className="font-bold text-sm text-[#29251d] dark:text-[#eee2ca] group-hover:text-[#8b673c] dark:group-hover:text-[#c3a47b] transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs text-[#5e5240] dark:text-[#c5b79e] leading-relaxed">
                  {p.desc}
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#7c6e58] dark:text-[#9f9179] truncate flex items-center gap-1">
                <FileText className="w-3 h-3 shrink-0" />
                {p.url.replace('https://', '')}
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};
