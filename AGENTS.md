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

Tech (bun@1.3.5 monorepo):

Apps:

- apps/web - TanStack Start (React 19, Router, Query), Vite 7, Tailwind v4, shadcn/Base UI
- apps/server - Hono + tRPC + Better-Auth
- apps/extension - WXT browser extension (out of scope)
- apps/tui - Terminal UI (out of scope)
- apps/fumadocs - Documentation site

Packages:

- @bs-shame/api - tRPC API layer with Drizzle
- @bs-shame/auth - Better-Auth wrapper
- @bs-shame/db - Drizzle ORM with libsql/Turso
- @bs-shame/env - Environment config (Zod validated)
- @bs-shame/config - Shared TypeScript/tooling config
- @bs-shame/infra - Alchemy deployment orchestration
  - we need to setup automatic deployments for @bs-shame/{web|server|fumadocs} (see ~/cau1k/caulk.lol/alchemy.run.ts):
    - @bs-shame/web - deploy to

Infra:

- Alchemy for Cloudflare deployments (dev/prod branches)
- Wrangler for local dev and CF integration
- Turso/libsql for database

Tooling:

- oxlint + oxfmt
- TypeScript 5
- Drizzle Kit for migrations

Domain:

- better-shame.com
