# RSS Reader - ISMG — Project Log

This project was scaffolded from the RSS Reader template (SeniorStoryteller/rss-reader) with all 7 phases already complete. The core feed engine, admin UI, CI/CD pipeline, and Vercel deployment setup carry over intact.

---

## Starting Point (April 2026)

**Scaffolded from:** `SeniorStoryteller/rss-reader` — all phases 1–7 complete
**GitHub:** `https://github.com/SeniorStoryteller/rss-reader-ismg`
**Production URL:** `https://rss-reader-ismg.vercel.app`

### What came with the template

- Next.js 14.x (Pages Router), TypeScript, Tailwind CSS
- Feed engine: fetch, parse, sanitize, cache (`s-maxage=300`)
- Admin UI at `/admin` (dev only) — add/edit/delete feeds, Commit & Push to `main`
- CI pipeline: feed validation, npm audit, type check, build
- Vercel deployment with preview branch workflow
- Security headers (CSP, HSTS, X-Content-Type-Options)

### What needs to be done before launch

- [x] Deploy to Vercel and record production URL
- [x] Update `og:image` absolute URL in `src/pages/index.tsx`
- [x] Update production URL in `README.md`
- [x] Clear `feeds.public.json` and add ISMG-relevant feeds
- [x] Create `preview` branch
- [x] Remove placeholder logos in `public/`
- [x] Add Bank Info Security logo as fallback banner for feed articles without images
- [ ] Wire up ISMG featured image as `og:image` (low priority — project being repurposed)

---

## Troubleshooting

### Vercel didn't auto-deploy after a push to `main`

**Symptom:** You push a commit to `main` (either directly with `git push origin HEAD:main` or via the admin UI's Commit & Push button) but the live site at `rss-reader-ismg.vercel.app` still serves the old build. GitHub's commit status API reports `pending` with an empty `statuses` array, and the commit is missing from Vercel's Deployments list.

**Cause:** Vercel's GitHub webhook occasionally fails to fire for a specific push. Other commits in the same session may deploy normally — it's intermittent.

**Fix:**
1. Go to the Vercel dashboard → project → **Deployments**
2. Click the **⋯** menu on the most recent successful deployment
3. Select **Redeploy**
4. **Uncheck** "Use existing Build Cache"
5. Click **Redeploy**

Vercel will build from the current `main` HEAD, which includes your missing commit.

**How to check whether Vercel picked up your commit before pushing a fix:**
```bash
gh api repos/SeniorStoryteller/rss-reader-ismg/deployments --jq '.[:2] | .[] | "sha: \(.sha[:7]) created: \(.created_at)"'
```
If your commit SHA doesn't appear in the first few entries, Vercel missed it.

**Optional:** Push an empty commit (`git commit --allow-empty -m "chore: trigger redeploy" && git push origin HEAD:main`) first — sometimes this kicks the webhook into firing. If that still doesn't work, use the dashboard redeploy.

---

---

## Session 2 — April 2026

### Changes shipped

| Commit | Description |
|---|---|
| `6589e49` | Show publication name below image; fix date parsing for ISMG feeds |
| `d13fb8d` | Display "Recent" instead of "Unknown date" for dateless items |
| `6183134` | Dedup cross-posted items by title; add all 7 ISMG feeds |
| `e406111` | Add Bank Info Security logo as fallback banner; remove stale template logos |
| `dc3619a` | Commit logo and featured image assets to `public/` |

### Key decisions and findings

**ISMG rate limiting (`429 Too Many Requests`)**
All 7 ISMG publications (`bankinfosecurity.com`, `healthcareinfosecurity.com`, etc.) are served from the same infrastructure. Fetching all 7 feeds in a single page load triggers rate limiting intermittently. The CDN cache (`s-maxage=300`) mitigates this once the cache is warm, but cold loads or rapid refreshes surface it. This is the primary blocker for keeping this as an ISMG-focused reader.

**Date parsing**
ISMG RSS feeds do not include per-item `<pubDate>` elements — only a channel-level date. All articles show "Recent" as the display date with a tooltip explaining the feed doesn't provide one. The date parser was hardened to handle `±HHmm` (no colon) offset format used by many feeds, plus a native `Date()` fallback.

**Dedup by title**
ISMG cross-posts the same article across multiple publications with different URLs (breaking guid-based dedup). Title normalization (trim + lowercase) before a Set lookup catches these. First-fetched source wins.

**Source logo banners**
Articles without a feed-supplied image fall back to a centered logo on a black banner. `Bank Info Security` is configured. Add other source logos to `SOURCE_LOGOS` in `src/components/ArticleCard.tsx` as needed.

### Planned repurposing

Due to the ISMG rate limit issue, this project will be repurposed for a different set of feeds. Next session:

1. Clear `feeds.public.json`
2. Rename the header in `src/components/Layout.tsx`
3. Update `SOURCE_LOGOS` in `src/components/ArticleCard.tsx` if new sources have logos
4. Add new feeds via the admin UI or by editing `feeds.public.json` directly

The Vercel project (`rss-reader-ismg.vercel.app`) and GitHub repo remain live — no teardown needed.

---

## Session 3 — April 2026

### Changes shipped

| Commit | Description |
|---|---|
| `bf43e04` | Repurpose as AI in the News; replace ISMG feeds with 10 AI-focused publications (interim) |
| `fc88c7c` | Harden image extraction and fix HTML showing in descriptions |
| `cd3974e` | Replace feeds with 15 AI × cybersecurity sources (final) |
| `e911e4a` | Rebrand to "AI & Cybersecurity Daily" |
| `7d74026` | Limit each feed to 10 most-recent items within a 14-day window |

### Key decisions and findings

**Final feed set: 15 sources across 5 categories**
- **AI Security Research:** Unit 42, Microsoft Security, Google Security, Google Threat Intelligence
- **Security News:** The Hacker News, Dark Reading, Bleeping Computer, The Record, SecurityWeek, The Register Security
- **Analysis:** Krebs on Security, Schneier on Security, SANS Internet Storm Center
- **AI Industry:** OpenAI Blog
- **Advisories:** CISA Advisories

**Recency filter + per-feed cap**
- Each feed caps at 10 most-recent items
- Items older than 14 days are dropped
- Items without a valid `pubDate` are dropped (for a "what's new" view, undated items can't be trusted as recent)
- Net effect: ~1,250 fetched items → ~115 kept (pre-dedup) → ~115 displayed (dedup rarely triggers for this mix; security press cross-posts less than ISMG did)
- Sliding window: `Date.now()` evaluated per request, so old content ages out automatically as new content publishes. No cron, no state.

**Branding**
- Site header: "AI & Cybersecurity Daily"
- Page titles, OG metadata, README all updated
- GitHub repo slug and Vercel project remain `rss-reader-ismg` — not worth the breakage to rename

---

## Session 4 — Planned: Port UX improvements from original RSS Reader

### Context

The sibling project at `/Users/seniorstoryteller/Claude Code Projects/RSS Reader` (GitHub: `SeniorStoryteller/rss-reader`, live: all-things-ai.vercel.app — confirm) has received ~40 UX commits since this project forked from it. The goal of Session 4 (and possibly 5, 6) is to port those improvements here, **one stage at a time**, with commit + push at the end of each stage so the user can review visually on the live site.

**Workflow:** One stage per session. User gives visual feedback, then starts a new session for the next stage.

### Deltas identified (what Original has that this project doesn't)

**Visual / UX:**
1. Horizontal card layout on desktop (image left 1/3, content right 2/3); stacked full-width image banner on mobile
2. Vertical flex single-column card list instead of 3-column grid
3. Topics | Sources tab switcher in sidebar — clickable source names filter the view
4. Source filtering via `?source=` URL query param (shareable, back-button works)
5. Smart relative dates on cards: "3h ago", "Yesterday", "2 days ago", then `EEE yyyy-MM-dd`
6. Orange left-border active indicator in sidebar (replaces filled background)
7. Darker page background + higher-contrast sidebar text
8. Category pill at bottom-right of the card content area
9. `object-contain` on card images (prevents edge cropping)
10. Mobile-specific card tweaks: smaller headline, hide description on small screens, pin date/pill to bottom

**Infrastructure:**
11. Swap `jsdom + dompurify` → `sanitize-html` (lighter bundle, same security)
12. ISR with `revalidate: 300` on feed pages (more reliable than SSR + cache headers)
13. Shared `NavLists` component (enables Topics/Sources refactor)
14. Sticky sidebar (`sticky top-6`)

### Behaviors to KEEP (do not revert when porting)

- **14-day recency window** — Original doesn't have this; AI×security moves faster than AI generally, so stale content is a problem
- **Per-feed cap of 10** — Original uses 20; we're sticking with 10 for density (revisit in Stage 5 if user wants more)
- **Drop undated items** — Original keeps them; we drop because undated = can't-confirm-fresh

### Stage plan

Each stage is one session. Commit + push + merge preview→main at the end so the live site reflects the change before the next session starts.

**Stage 1 — Quick visual wins (~45 min)**
- Smart relative dates on cards
- Orange left-border active indicator in sidebar
- Darker page background + sidebar contrast
- `object-contain` for card images
- Category pill to bottom-right of card

**Stage 2 — Card + page layout (~1 hr)**
- Horizontal cards on desktop (image left 1/3, content right 2/3)
- Stacked full-width image banner on mobile
- Line-clamp titles and descriptions (2–3 lines depending on viewport)
- Single-column flex list replacing the 3-column grid
- Responsive typography tweaks

**Stage 3 — Topics | Sources sidebar (~1.5 hrs)**
- Extract `NavLists` shared component
- Add Topics | Sources tab switcher to sidebar (and mobile nav)
- Wire `?source=` URL query param filtering
- Active-state highlighting on selected source/topic
- Sticky sidebar (`sticky top-6`)

**Stage 4 — Sanitizer swap + ISR (~45 min)**
- Remove `jsdom` and `dompurify` deps, add `sanitize-html`
- Rewrite `src/lib/sanitize.ts`
- Convert index + category pages to `getStaticProps` with `revalidate: 300`
- No user-visible change; performance + bundle size improvement

**Stage 5 — Negotiations / optional tweaks** ✅ Complete
- Per-feed cap: kept at 10 (user decision)
- OG image renamed: `ISMG Feed Reader - 01.png` → `ai-cybersecurity-daily-og.png`; URL updated in `src/pages/index.tsx`
- Sticky sidebar: already present from Stage 3 (`sticky top-6 self-start` on `<aside>`)
- Full diff of original vs ISMG confirmed: no unintentional gaps; ISMG is actually ahead on image extraction (`data-src` fallback) and sanitization (`stripHtml`)

### How to resume in a new session

1. Open this project in Claude Code Desktop: `/Users/seniorstoryteller/Claude Code Projects/RSS Reader - ISMG`
2. Prompt: *"Read docs/PHASES.md Session 4 plan, then do Stage N."* (replace N with the next stage)
3. For Stages 1–4 the code reference is the original project at `/Users/seniorstoryteller/Claude Code Projects/RSS Reader` — read the relevant files there, adapt patterns here, keep the "behaviors to KEEP" intact.

---

## Session 5 — Trending topic filter ✅ Complete

### Changes shipped

| Commit | Description |
|---|---|
| `5820a59` | Trending filter + fix imageUrl undefined→null serialization crash |
| `b5f4446` | safeStr() coercion for all rss-parser fields (xmldom object-as-guid render crash) |
| `0b0423f` | Pre-push hook: npm run build runs automatically before every push |
| `c732baf` | Raise threshold to 4, block ubiquitous tech/AI names from keyword extraction |
| `e1a52a5` | Dynamic noise ceiling: auto-suppress keywords appearing in ≥60% of active sources |
| `c21033f` | Search bar below header; Trending visible on all pages |
| `a22ff14` | Fix search bar: move to sidebar below nav list (matches original RSS Reader pattern) |

### Key decisions

**Trending implementation:** Topic/keyword clustering (not title match). Proper nouns + CVE patterns extracted from titles + descriptions. Keywords scored by number of distinct sources mentioning them in a 7-day window. `trendingScore` attached to each `FeedItem` at ISR time in `src/lib/rss.ts`.

**Threshold:** 4 sources (user's original instinct — 3 produced 50+ articles).

**Dynamic noise ceiling:** Any keyword appearing in ≥60% of active sources is auto-suppressed as structural noise (catches "Google", "Microsoft", "China" etc. without a manual list). Static blocklist handles generic English and security terms.

**Scope:** Trending appears in Topics list on every page; clicking always navigates to `/?trending=1` (global filter, not per-category).

**Search bar:** Lives in the Sidebar (desktop) and MobileNav panel (mobile), below the nav list — same as the original RSS Reader.

**Pre-existing bugs fixed this session:**
- `imageUrl?: string` → `imageUrl: string | null` — undefined can't serialize through getStaticProps (was breaking every CI build since Stage 4)
- `safeStr()` on all rss-parser fields — some feeds return `<guid>` with XML attributes that xmldom parses as a node object; React's key coercion threw on it

---

## Session 6 — Planned: Private daily research report

### Context

User wants a personal intelligence layer — not public — that uses Claude Opus 4.7 to surface hidden patterns across all feed articles that wouldn't be visible from reading individual posts. Examples: source-tier divergence, timing clusters, buried named-entity mentions, weak persistent signals (the "250 hitter becoming a 300 hitter" pattern).

### Open questions before building

1. **Delivery:** Private `/report` page (bookmarked URL), email to seniorstoryteller+claude@gmail.com, or both?
2. **Data depth:** RSS excerpts only (already in feed, zero extra requests) vs. full article text (fetch each URL, richer signal — requires scheduled job + storage)?

### Prompt for next session

*"Read docs/PHASES.md Session 6 plan."*

---

## Future phases / changes

*(Log significant changes here as they happen)*
