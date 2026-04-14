# RSS Reader - ISMG — Project Log

This project was scaffolded from the RSS Reader template (SeniorStoryteller/rss-reader) with all 7 phases already complete. The core feed engine, admin UI, CI/CD pipeline, and Vercel deployment setup carry over intact.

---

## Starting Point (April 2026)

**Scaffolded from:** `SeniorStoryteller/rss-reader` — all phases 1–7 complete
**GitHub:** `https://github.com/SeniorStoryteller/rss-reader-ismg`
**Production URL:** `https://rss-reader-ismg-d5ogo2a1a-seniorstorytellers-projects.vercel.app`

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
- [ ] Update production URL in `README.md`
- [ ] Clear `feeds.public.json` and add ISMG-relevant feeds
- [ ] Create `preview` branch
- [ ] Replace or remove placeholder logos in `public/`
- [ ] Add ISMG-specific featured image to `public/`

---

## Future phases / changes

*(Log significant changes here as they happen)*
