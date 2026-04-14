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
- [ ] Add ISMG-specific featured image to `public/` and wire it up as `og:image`

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

## Future phases / changes

*(Log significant changes here as they happen)*
