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

## Future phases / changes

*(Log significant changes here as they happen)*
