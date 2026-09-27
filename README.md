# Bunyip Box

Bunyip Box is a private content research and curation product owned and operated by **Hawker Works LLC**. Milestone 1 established the minimal application and isolated DigitalOcean environments. Milestone 2 is adding the PostgreSQL, Prisma, authentication, workspace, and authorization foundation. Meta integration remains deliberately deferred.

## Current architecture

- Next.js App Router and TypeScript, packaged as a standalone Node.js application.
- DigitalOcean App Platform web service templates for independent production and staging apps.
- Public `/privacy`, `/terms`, and `/data-deletion` routes and a shared ownership footer.
- GitHub Actions checks for lint, type checking, and production build.
- Prisma schema and migrations for the Milestone 2 identity, workspace, List,
  session, and invitation foundation.
- A minimal `/api/health/database` readiness endpoint that reports only
  `ok`/`unavailable`, never connection details or query errors.

## Local verification (for contributors and CI)

The owner does not need to maintain a local environment; these commands are for automated checks and contributors.

```bash
npm install --no-audit --no-fund
npm run lint
npm run typecheck
npm run test:authorization
npm run test:invitations
npm run build
npm run db:validate
npm start
```

## Milestone 1 deployment runbook

External infrastructure has **not** been assumed or marked complete. Follow these steps in order.

### 1. Confirm accounts and repository

1. Sign in to DigitalOcean and confirm the account is active.
2. In the DigitalOcean control panel, choose **Projects → New Project**.
3. Name it `Bunyip Box`, add a useful description, choose the appropriate purpose, and create it.
4. Confirm this repository is hosted in the intended GitHub account and that `main` is protected for production promotion.
5. Create a `develop` branch for staging after this initial change is merged.

Expected result: the DigitalOcean project appears in the project switcher, and GitHub shows the repository and protected production branch.

### 2. Deploy production to a DigitalOcean starter URL

1. In the Bunyip Box project, choose **Create → App Platform → GitHub**.
2. Authorize DigitalOcean for only the intended repository where practical.
3. Select this repository and the `main` branch; enable automatic deployment.
4. Choose a **Web Service** with Node.js, the smallest practical instance, build command `npm install --no-audit --no-fund && npm run build`, run command `npm start`, and HTTP port `8080`.
5. Add `NODE_ENV=production`. Leave `APP_URL` unset until the starter URL is known.
6. Review the plan, create the app, and wait for the deployment to become **Active**.
7. Open the generated `ondigitalocean.app` URL and check `/`, `/privacy`, `/terms`, and `/data-deletion`.
8. Set `APP_URL` to that exact HTTPS starter URL and redeploy.

The `.do/production-app.yaml` file is a reviewable template, not a ready-to-import claim: replace its GitHub placeholder first.

Expected result: deployment and runtime checks are green; all four public URLs return successfully over HTTPS and show the Hawker Works LLC ownership footer.

### 3. Stop and confirm the custom hostname

**Owner confirmation is required before any DNS change.** Confirm the exact purchased domain and desired application hostname. The recommended pattern is `app.bunyipbox.com` if the purchased domain is `bunyipbox.com`, preserving the apex domain for a future marketing site. Do not continue from this checkpoint based on the example alone.

Record the confirmed values privately:

```text
Purchased domain: ____________________
Production app hostname: ____________________
DNS provider: ____________________
```

### 4. Connect the confirmed domain and verify HTTPS

Only after Step 3 is confirmed:

1. Open the production app in DigitalOcean and choose **Settings → Domains → Add Domain**.
2. Enter the confirmed hostname and follow the control panel&apos;s displayed DNS instructions.
3. At the DNS provider, add exactly the record DigitalOcean requests. Do not redirect the root domain unless that was explicitly selected.
4. Return to DigitalOcean and wait for the domain status and TLS certificate to become active.
5. Open the confirmed `https://` hostname in a private browser window and verify there is no certificate warning.
6. Set the production `APP_URL` to the exact canonical HTTPS origin (no temporary hostname and no trailing path), then redeploy.
7. Recheck the homepage and each public compliance route at the canonical hostname.

Expected result: DigitalOcean reports the domain active, the browser reports a valid HTTPS certificate, and the canonical site loads without redirect loops.

### 5. Create isolated staging

1. Choose **Create → App Platform → GitHub** again; create a new app named `bunyip-box-staging` inside the Bunyip Box project.
2. Select the same repository but choose `develop`; enable automatic deployment.
3. Use the same build/run commands and smallest practical web instance.
4. Keep the DigitalOcean staging starter hostname unless a stable staging hostname is later required.
5. Set staging `APP_URL` to its own HTTPS starter URL.
6. Never copy production secrets into staging. Future databases and credentials must be separate.
7. Deploy and verify `/`, `/privacy`, `/terms`, and `/data-deletion` independently.

Expected result: production follows `main`, staging follows `develop`, each has its own URL and environment configuration, and a staging deployment cannot modify production resources.

## Public compliance URLs

Replace `<confirmed-production-origin>` only after domain verification:

- `<confirmed-production-origin>/privacy`
- `<confirmed-production-origin>/terms`
- `<confirmed-production-origin>/data-deletion`

The pages intentionally do not invent a support email. Before public launch, Hawker Works LLC must provide a verified business contact channel, and the legal pages should be reviewed for the business&apos;s jurisdiction and actual practices.

## Environments and promotion

Feature branch → pull request and CI → `develop` → staging smoke test → intentional release pull request → `main` → production. Production is not an experimental environment. Milestone 2 will add separate PostgreSQL resources and pre-deploy Prisma migrations only after this foundation is verified.

## Milestone 2 security design

The implementation contract for authentication, workspace and per-List
authorization, personal-data isolation, and secure no-email invitations is in
[`docs/milestone-2-security-design.md`](docs/milestone-2-security-design.md).
Milestone 2 database and authentication work must preserve that document's
default-deny permission matrix and invitation threat-model controls.

## Database and migrations

Prisma uses two environment-specific PostgreSQL connections:

- `DATABASE_URL` is the encrypted pooled connection used by the running web
  application.
- `DIRECT_URL` is the encrypted direct administrative connection used only by
  the controlled `prisma migrate deploy` deployment step.
- `RUNTIME_DATABASE_USER` is the non-secret, environment-specific PostgreSQL
  role that receives only the schema usage and data access needed by the web
  application after migrations run.

Never run development migrations against staging or production. Create and
review migration SQL in the repository, then apply checked-in migrations with
`npm run db:migrate:deploy`, followed by `npm run db:grant:runtime` from the
same isolated pre-deploy job. In that job, both database URLs use its encrypted
direct administrative connection; the web service retains only its pooled
runtime URL. Production and staging must use different clusters, databases,
users, pools, and values for all database configuration.

`GET /api/health/database` performs a server-side `SELECT 1` through the web
service's runtime pool. It returns HTTP 200 with `{"status":"ok"}` or HTTP 503
with `{"status":"unavailable"}`, disables response caching, and intentionally
does not expose database identifiers or errors.

## Secure team invitations

Workspace Owners manage invitations at `/team`. Invitation links contain 256
bits of random token material, expire after seven days, and are displayed only
when created or replaced. PostgreSQL stores only a domain-separated token hash.
Creating a replacement revokes earlier pending invitations for the same
workspace and normalized email, while explicit revocation leaves any already
redeemed membership unchanged.

The `/invite/[token]` redemption route supports an existing account or
invitation-bound account creation. Redemption requires an exact normalized
email match and atomically consumes the invitation, creates or associates the
Member workspace membership, and applies initial Viewer/Manager permissions.
The route sends `no-referrer`, `noindex`, and `no-store` headers and records
only hashed signals for its bounded attempt limiter.

## Configuration

| Variable | Use |
| --- | --- |
| `APP_URL` | Exact environment-specific canonical HTTPS origin. |
| `NODE_ENV` | `production` in deployed applications. |
| `DATABASE_URL` | Encrypted environment-specific pooled runtime PostgreSQL URL. |
| `DIRECT_URL` | Encrypted environment-specific direct migration PostgreSQL URL; never exposed to runtime browser code. |
| `RUNTIME_DATABASE_USER` | Non-secret database role name that receives runtime grants after migrations. |

Store values in DigitalOcean environment configuration. Never commit `.env` files or credentials. Authentication and Meta variables are introduced only with the features that require them.

## Troubleshooting

- **Build fails:** inspect App Platform build logs and confirm Node 22 is in use. The bootstrap environment could not reach npm; after the first successful networked install, commit its lockfile and change install commands from `npm install` to `npm ci` for reproducible builds.
- **Health check fails:** confirm the component is a web service, uses `npm start`, and exposes port `8080`.
- **Domain remains pending:** compare the hostname and DNS record exactly with DigitalOcean&apos;s current instructions; remove conflicting records, then allow DNS time to propagate.
- **Certificate warning:** do not set the canonical `APP_URL` or proceed to later integrations until DigitalOcean reports TLS active.
- **Wrong environment deploys:** confirm production tracks `main` and staging tracks `develop` before retrying.

## Deferred by design

Team-management UI, jobs, backups, and every Meta capability remain deferred until their Milestone 2 implementation steps. Meta setup or integration must not begin until the application foundation and authorization model are complete.
