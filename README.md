# Bunyip Box

Bunyip Box is a private content research and curation product owned and operated by **Hawker Works LLC**. This repository currently contains **Milestone 1 only**: a minimal Next.js application, public compliance pages, CI, and DigitalOcean deployment templates. It deliberately contains no database, authentication, worker, or Meta integration.

## Current architecture

- Next.js App Router and TypeScript, packaged as a standalone Node.js application.
- DigitalOcean App Platform web service templates for independent production and staging apps.
- Public `/privacy`, `/terms`, and `/data-deletion` routes and a shared ownership footer.
- GitHub Actions checks for lint, type checking, and production build.

## Local verification (for contributors and CI)

The owner does not need to maintain a local environment; these commands are for automated checks and contributors.

```bash
npm install --no-audit --no-fund
npm run lint
npm run typecheck
npm run build
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

## Configuration

| Variable | Milestone 1 use |
| --- | --- |
| `APP_URL` | Exact environment-specific canonical HTTPS origin. |
| `NODE_ENV` | `production` in deployed applications. |

Store values in DigitalOcean environment configuration. Never commit `.env` files or credentials. Future database, authentication, and Meta variables described in the requirements are intentionally not introduced in this milestone.

## Troubleshooting

- **Build fails:** inspect App Platform build logs and confirm Node 22 is in use. The bootstrap environment could not reach npm; after the first successful networked install, commit its lockfile and change install commands from `npm install` to `npm ci` for reproducible builds.
- **Health check fails:** confirm the component is a web service, uses `npm start`, and exposes port `8080`.
- **Domain remains pending:** compare the hostname and DNS record exactly with DigitalOcean&apos;s current instructions; remove conflicting records, then allow DNS time to propagate.
- **Certificate warning:** do not set the canonical `APP_URL` or proceed to later integrations until DigitalOcean reports TLS active.
- **Wrong environment deploys:** confirm production tracks `main` and staging tracks `develop` before retrying.

## Deferred by design

PostgreSQL, Prisma migrations, authentication, owner bootstrap, timezone settings, list functionality, jobs, backups, and every Meta capability belong to later milestones. Meta setup or integration must not begin until the deployed foundation, canonical domain, HTTPS, compliance pages, ownership language, and isolated staging app have been verified.
