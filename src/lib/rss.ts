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

function extractImageUrl(item: Parser.Item & CustomItem): string | undefined {
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

  return undefined;
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
      title: item.title || 'Untitled',
      link: item.link || '',
      timestamp: parseDate(item.isoDate, item.pubDate),
      pubDate: item.isoDate || item.pubDate || '',
      description: item.contentSnippet || stripHtml(item.content || item.summary || ''),
      source: config.name,
      category: config.category,
      guid: item.guid || item.link || '',
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

  return { items: deduped, failed };
}
