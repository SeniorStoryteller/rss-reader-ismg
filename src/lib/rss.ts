import Parser from 'rss-parser';
import { sanitizeHtml, stripHtml } from './sanitize';
import { parseDate } from './dates';
import type { FeedConfig, FeedItem, FailedFeed } from './types';

type CustomItem = {
  mediaContent?: { $?: { url?: string } };
  mediaThumbnail?: { $?: { url?: string } };
};

const parser = new Parser<Record<string, never>, CustomItem>({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
});

function extractImageUrl(item: Parser.Item & CustomItem): string | null {
  // 1. enclosure — accept image/* types; also accept if no type is declared
  // (some feeds omit the type attribute entirely). Reject non-image types
  // (e.g. audio/mpeg from podcast feeds) to avoid showing audio files as images.
  if (item.enclosure?.url?.startsWith('https://')) {
    const t = item.enclosure.type ?? '';
    if (!t || t.startsWith('image/')) return item.enclosure.url;
  }

  // 2. media:content
  const mediaContentUrl = item.mediaContent?.$?.url;
  if (mediaContentUrl?.startsWith('https://')) return mediaContentUrl;

  // 3. media:thumbnail
  const mediaThumbnailUrl = item.mediaThumbnail?.$?.url;
  if (mediaThumbnailUrl?.startsWith('https://')) return mediaThumbnailUrl;

  // 4. first <img> in content HTML — try src= first, then data-src= (lazy-load pattern)
  const html = item.content || item.summary || '';
  const match =
    html.match(/<img[^>]+src=["'](https:\/\/[^"']+)["']/i) ||
    html.match(/<img[^>]+data-src=["'](https:\/\/[^"']+)["']/i);
  if (match?.[1]) return match[1];

  return null;
}

function safeStr(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  try { return String(value); } catch { return fallback; }
}

function stripXxeVectors(xml: string): string {
  return xml
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!ENTITY[^>]*>/gi, '');
}

// Per-feed recency window and item cap. AI x security moves fast — anything
// older than two weeks is stale. Capping per-feed keeps high-volume sources
// (OpenAI's 942-item archive feed, The Register's 50-item feed) from drowning
// out lower-volume ones like Krebs or Schneier.
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_ITEMS_PER_FEED = 10;

const TRENDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const TRENDING_THRESHOLD = 4;

// Words too common in security/AI news to be a meaningful cross-source signal.
// Anything NOT in this list that's capitalized + 4+ chars is a candidate keyword.
const GENERIC_WORDS = new Set([
  'With', 'From', 'Into', 'Over', 'About', 'After', 'Before', 'During',
  'That', 'This', 'These', 'Those', 'Then', 'They', 'When', 'What', 'Where',
  'Which', 'While', 'Also', 'More', 'Some', 'Such', 'Many', 'Most', 'Both',
  'Very', 'Just', 'Even', 'Only', 'Well', 'Will', 'Been', 'Being', 'Gets',
  'Have', 'Here', 'High', 'Know', 'Like', 'Make', 'Need', 'News', 'Says',
  'Show', 'Take', 'Than', 'Used', 'Uses', 'Using', 'Want', 'Were', 'Your',
  'Their', 'Them', 'Because', 'Without', 'Against', 'Across', 'Between',
  // Generic security/AI terms that appear in almost every article
  'Security', 'Cyber', 'Attack', 'Attacks', 'Threat', 'Threats', 'Actor',
  'Actors', 'Advanced', 'Persistent', 'Malware', 'Ransomware', 'Phishing',
  'Vulnerability', 'Vulnerabilities', 'Exploit', 'Exploits', 'Patch', 'Patches',
  'Breach', 'Breaches', 'Hack', 'Hacked', 'Hackers', 'Hacking', 'Incident',
  'Data', 'Network', 'Networks', 'System', 'Systems', 'Software', 'Hardware',
  'Research', 'Researchers', 'Report', 'Reports', 'Analysis', 'Analyst',
  'Alert', 'Advisory', 'Update', 'Updates', 'Critical', 'Severe',
  'Risk', 'Risks', 'Issue', 'Issues', 'Supply', 'Chain', 'Zero',
  'Campaign', 'Operation', 'Activity', 'Group', 'Groups', 'Team', 'Teams',
  'User', 'Users', 'Account', 'Accounts', 'Access', 'Credential', 'Credentials',
  'Password', 'Passwords', 'Token', 'Tokens', 'Code', 'Tool', 'Tools',
  'Cloud', 'Platform', 'Service', 'Services', 'Infrastructure', 'Enterprise',
  'Government', 'Federal', 'Agency', 'Agencies', 'Organizations', 'Company',
  'Companies', 'Vendor', 'Vendors', 'Provider', 'Providers', 'Sector',
  'Week', 'Month', 'Year', 'Today', 'Recent', 'Latest', 'First', 'Second',
  'Multiple', 'Several', 'Other', 'Large', 'Major', 'Detection', 'Protection',
  'Intelligence', 'Threat', 'Artificial', 'Machine', 'Learning', 'Model',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'June', 'July',
  'August', 'September', 'October', 'November', 'December',
  // Major tech companies — present across every category, not a meaningful trend signal
  'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Nvidia', 'Tesla',
  'GitHub', 'Adobe', 'Oracle', 'Cisco', 'Intel', 'Qualcomm',
  // AI products/platforms — always present in this feed
  'OpenAI', 'ChatGPT', 'Gemini', 'Copilot', 'Grok', 'Anthropic', 'Llama',
  // OS/platforms — appear in nearly every security article
  'Windows', 'Linux', 'Android', 'Chrome', 'Firefox', 'Safari', 'macOS',
]);

function extractKeywords(title: string, description: string): string[] {
  const text = `${title} . ${description}`;
  const results = new Set<string>();

  for (const m of text.matchAll(/CVE-\d{4}-\d+/g)) {
    results.add(m[0]);
  }

  const tokens = text.split(/\s+/).map((t) => t.replace(/[^a-zA-Z0-9-]/g, ''));
  const isSignificant = (t: string) =>
    t.length >= 4 && /^[A-Z]/.test(t) && !GENERIC_WORDS.has(t);

  let run: string[] = [];

  const flushRun = () => {
    if (run.length === 0) return;
    results.add(run[0]);
    if (run.length >= 2) results.add(`${run[0]} ${run[1]}`);
    if (run.length >= 3) results.add(`${run[0]} ${run[1]} ${run[2]}`);
    run = [];
  };

  for (const token of tokens) {
    if (isSignificant(token)) {
      run.push(token);
    } else {
      flushRun();
    }
  }
  flushRun();

  return Array.from(results);
}

async function fetchSingleFeed(
  config: FeedConfig
): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(config.url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const rawXml = await response.text();
    const cleanXml = stripXxeVectors(rawXml);
    const feed = await parser.parseString(cleanXml);

    const cutoff = Date.now() - MAX_AGE_MS;

    const mapped = (feed.items || []).map((item) => ({
      title: safeStr(item.title, 'Untitled'),
      link: safeStr(item.link),
      timestamp: parseDate(item.isoDate, item.pubDate),
      pubDate: safeStr(item.isoDate || item.pubDate),
      description: safeStr(item.contentSnippet) || stripHtml(safeStr(item.content || item.summary)),
      source: config.name,
      category: config.category,
      guid: safeStr(item.guid) || safeStr(item.link),
      imageUrl: extractImageUrl(item),
    }));

    // Keep only dated items within the recency window, most recent first,
    // capped at MAX_ITEMS_PER_FEED. Items with timestamp 0 (feed gave no
    // date) are dropped — for a "what's new" feed, undated items can't be
    // trusted to be recent.
    return mapped
      .filter((item) => item.timestamp > 0 && item.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_ITEMS_PER_FEED);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAllFeeds(
  configs: FeedConfig[]
): Promise<{ items: FeedItem[]; failed: FailedFeed[] }> {
  const results = await Promise.allSettled(
    configs.map((config) => fetchSingleFeed(config))
  );

  const items: FeedItem[] = [];
  const failed: FailedFeed[] = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    } else {
      failed.push({
        name: configs[i].name,
        reason: result.reason?.message || 'Unknown error',
      });
    }
  });

  // Dedup by normalized title. Cross-posting networks like ISMG publish the
  // same article across multiple sites with different URLs (so guid-based
  // dedup doesn't catch them). The item from whichever feed was fetched
  // first wins — its source/category is what shows on the card.
  const seen = new Set<string>();
  const deduped: FeedItem[] = [];
  for (const item of items) {
    const key = item.title.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  deduped.sort((a, b) => b.timestamp - a.timestamp);

  // Build keyword → source-set map from all pre-dedup items within the 7-day
  // trending window, then score each deduped item by its highest-frequency keyword.
  const trendingCutoff = Date.now() - TRENDING_WINDOW_MS;
  const keywordSources = new Map<string, Set<string>>();
  for (const item of items) {
    if (item.timestamp < trendingCutoff) continue;
    for (const kw of extractKeywords(item.title, item.description)) {
      if (!keywordSources.has(kw)) keywordSources.set(kw, new Set());
      keywordSources.get(kw)!.add(item.source);
    }
  }

  // Any keyword appearing in ≥60% of active sources is structural noise for this
  // feed (e.g. "Google", "China") — auto-suppress without needing a static list.
  const activeSources = new Set(
    items.filter((i) => i.timestamp >= trendingCutoff).map((i) => i.source)
  );
  const noiseCeiling = Math.round(activeSources.size * 0.6);

  for (const item of deduped) {
    if (item.timestamp < trendingCutoff) {
      item.trendingScore = 0;
      continue;
    }
    let score = 0;
    for (const kw of extractKeywords(item.title, item.description)) {
      const count = keywordSources.get(kw)?.size ?? 0;
      if (count >= TRENDING_THRESHOLD && count < noiseCeiling && count > score) {
        score = count;
      }
    }
    item.trendingScore = score;
  }

  return { items: deduped, failed };
}
