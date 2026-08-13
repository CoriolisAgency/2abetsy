# Human ops — what the agent cannot finish

Repo work for the brand book, entity kit, heroes, leaks, wordmark, and press page is in the lattice. This is the remaining **account / physical / cadence** list.

## X (@2ABetsy)

API **can** delete posts (`DELETE /2/tweets/:id`) and update bio (`POST account/update_profile.json`). It **cannot** reliably set avatar, banner, or pin on this app’s access.

- [ ] Confirm bio is the Glance lock (script: `npx tsx scripts/update-betsy-x-profile.ts` in `gunsearchengine`)
- [ ] Avatar = `betsy-headshot-work.png` (not Demand Store “B”)
- [ ] Banner = `betsy-at-the-range-work.jpg` or BI Co-Pilot still
- [ ] Pin the SHOT 2027 Short or the 9mm glance post — not a reply
- [ ] Re-run `npx tsx scripts/scrub-betsy-x.ts --apply` after the write window resets (~15–60 min). First pass deleted 50; ~36 leftovers 429’d. Script is idempotent — it only deletes what is still on the timeline.
- [ ] Scroll older than the last 100 posts and delete anything off-register (API only returns ~100 per pull)
- [ ] Stop using this handle as a personal reply bot. Personal takes go on your own account or @CoriolisAgency
- [ ] Turn on the glance composer as the weekday default (Building Seven → Betsy X). Human-approve two weeks, then cron

## YouTube (@BetsyAI)

No YouTube write API in this workspace.

- [ ] Channel about can stay “gun-friendly AI search agent…” (SEO/Camera). Keep that phrase out of chat.
- [ ] Pin “start here” = Meet Betsy + dealer Short + SHOT
- [ ] Playlists: Dealers / Shoppers / Brands
- [ ] End card → https://2abetsy.com/start
- [ ] Ship the remaining starter shelf: Meet Betsy · What’s hot · Unmet demand · My Betsy on the floor
- [ ] Cross-post new Shorts to X. Do not cross-post old reply-guy posts

## Physical / SHOT 2027

See `shot-2027-kit.md`.

- [ ] Print retractable from `betsy-at-the-range-work.jpg`
- [ ] Counter QR card → 2abetsy.com/start
- [ ] One-pager from `/resume`
- [ ] No restricted stills on the booth

## Cadence (ongoing)

| Day | X (Glance) |
|-----|------------|
| Mon | Prior-day glance |
| Tue | #BettysShelf |
| Wed | Unmet / rising |
| Thu | Product proof |
| Fri | Partner or frozen doctrine + fortress link |

Weekly 15-minute check: did this week’s posts pass the register table in `gunsearchengine/docs/betsy-brand-book.md`?
