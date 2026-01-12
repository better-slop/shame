
In response to a Tweet by Mitchell Hashimoto, we want to build a platform that installs an application into your GitHub repo or organization, that addresses the following issue:

> The people who just blindly toss AI shit over a wall onto other humans without using their brain for even a nanosecond deserve shaming. We need to start a public wall of shame for the public identities (not doxing) of these people so we can have bots that just block them.
>
> I don't care at all if you do this in your own projects, but when you cross a boundary where another human has to interact with you, its common courtesy to at the very least spend any amount of time at all thinking (the horror).

Basic ideas:

0. Really simple user interface
   - easy one click install on the main page even after a user has installed it
1. Have a master list of GitHub usernames/accounts that are known to be bad actors.
2. Have a reason for blocking them (e.g., a PR, a comment, an issue, etc.)
3. Have a ranking system for the bad actors - e.g.:
   - If they only have one occurrence of being banned, add them to a crowdsourced list managed by organizations and repositories, don't immediately ban them. But have a flag by their name essentially ("this account has been banned on other repositores" and then list the repository and reason)
   - If they have a second ban in another repo, automatically flag them in the dashboard if they
   - If they have a third reported issue from the crowdsourced list, automatically ban them from ALL organizations and repositories.
4. Collect as much data as possible about the bad actors, e.g., PRs, comments, issues, datetimes, aggregated abuse reports
5. Configurable rules for what constitutes a ban in YOUR organization/repo - do we autoban if they have 1, 2, or 3 bans in other repos?
6. Browser extension that adds a "ban" next to users' names on PRs, issues, comments, etc.
7. TUI that automatically recognizes that you are in a gh pr checkout XXX and then shows the PR author's name. Allows you to browse through PRs, issues, ban lists, etc. Out of scope for now

Tech:

- Cloudflare Workers
- Alchemy.run (see how I did this in ~/cau1k/caulk.lol/alchemy.run.ts with automated deployments)
  - only change is having a dev branch and a prod branch
  - also, this is in @packages/infra
- Tanstack Start for frontend/authentication
- Better-Auth for authentication on D1
- Hono API
- Effect.ts - fully effectful
- Durable workflows/jobs somehow
- bun monorepo
  - packages/extension (chrome extension that communicates with the api - out of scope for now)
  - packages/auth (reusable better-auth server/client paradigm)
  - packages/db (d1 adapter)
    - exports:
      - @bs-shame/db/auth - d1 solely for better-auth
      - @bs-shame/db/crowd - d1 solely for the reports/etc
  - apps/api (hono)
  - apps/web (tanstack)
- oxc
  - linter (type aware linting with oxlint-tsgolint; see https://oxc.rs/blog/2025-12-08-type-aware-alpha.html)
  - formatter (with prettier)

