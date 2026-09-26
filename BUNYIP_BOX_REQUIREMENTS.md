# BUNYIP BOX

## MVP Product Requirements Document

Private Facebook content research, analytics, and curation application

> **Version 2.1**
> Prepared for implementation with OpenAI Codex, GitHub, and DigitalOcean App Platform
> Date: September 26, 2026


**Implementation posture**  
Build incrementally. Verify external platform capabilities before coding against them. Keep production deployable after every milestone.

> **Codex usage:** Treat this file as the authoritative MVP requirements document. Follow the build order and implementation gates; do not skip ahead past an external dependency that requires owner action or verification.

# Document at a glance

| **Item**                     | **Decision**                                                                                                                                                                     |
|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Product                      | Bunyip Box                                                                                                                                                                       |
| Legal owner                  | Hawker Works LLC. Bunyip Box is the product/brand and is not a separate legal entity.                                                                                            |
| Primary purpose              | Discover and analyze high-performing posts from selected public Facebook Pages, then save useful posts for content research and curation.                                        |
| Hosting                      | DigitalOcean App Platform; cloud-only workflow. No local development environment is required for the owner.                                                                      |
| Canonical app URL            | Connect the purchased Bunyip Box domain after the first minimal production deployment succeeds. Recommended pattern: app.bunyipbox.com if the purchased domain is bunyipbox.com. |
| Public compliance pages      | Unauthenticated Privacy Policy, Terms of Service, and Data Deletion Instructions pages that clearly identify Hawker Works LLC as the owner/operator of Bunyip Box.               |
| Source control / development | GitHub repository developed with OpenAI Codex.                                                                                                                                   |
| Core stack                   | Next.js + TypeScript + PostgreSQL + Prisma.                                                                                                                                      |
| Background processing        | DigitalOcean worker plus PostgreSQL-backed durable jobs; scheduled DigitalOcean jobs enqueue periodic synchronization and reconciliation work.                                   |
| Facebook access              | Official Meta Graph API only. Prove both development capability and production eligibility before implementing each Facebook feature.                                            |
| MVP scope                    | Lists, tracked Pages, ingestion, post analytics, sorting/filtering/search, saved posts, CSV export, freshness/status visibility, cloud staging, automated tests.                 |
| Explicitly excluded          | Scheduling/publishing, AI caption generation, billing, teams/organizations, email delivery, native mobile apps, non-Facebook social networks.                                    |

| **Source of truth:** For Facebook-specific capabilities, the current Meta Graph API behavior observed with the approved app and token is authoritative. If a required capability is unavailable, Bunyip Box must surface the limitation rather than scrape, circumvent, or silently substitute behavior. |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

# Contents

| 1\. Product objective                                 | 12\. Ingestion and job architecture                 | 23\. Data freshness and system status                |
|-------------------------------------------------------|-----------------------------------------------------|------------------------------------------------------|
| 2\. Product semantics and definitions                 | 13\. Initial historical backfill                    | 24\. Data retention, unavailable content, and images |
| 3\. Scope and exclusions                              | 14\. Incremental synchronization and metric refresh | 25\. Responsive design, accessibility, and UX        |
| 4\. Technology and architecture                       | 15\. Facebook Page and post data                    | 26\. Minimum database model                          |
| 5\. Environments, domain, and canonical URLs          | 16\. Historical metric snapshots                    | 27\. Security requirements                           |
| 6\. Codex onboarding and DigitalOcean setup           | 17\. List detail screen                             | 28\. Testing and CI                                  |
| 7\. Secrets and configuration                         | 18\. Top Posts                                      | 29\. Deployment, migrations, and backups             |
| 8\. Authentication, account model, and user ownership | 19\. Simple post grade                              | 30\. MVP acceptance criteria                         |
| 9\. Lists dashboard                                   | 20\. Saved Posts                                    | 31\. Build order                                     |
| 10\. Adding and managing Facebook Pages               | 21\. Search, pagination, and performance            | 32\. Implementation principles for Codex             |
| 11\. Meta API implementation gates                    | 22\. CSV export                                     | 33\. First instruction to Codex                      |

# 1. Product objective

Build a private web application named Bunyip Box for discovering and analyzing high-performing posts from selected public Facebook Pages. The primary use case is content curation: the user organizes Pages into lists, Bunyip Box ingests the post and engagement data available through the official Meta Graph API, and the user finds the strongest posts for a selected publication period.

The supplied Strevio screenshots are visual and information-architecture references only. Do not copy Strevio branding, proprietary code, or reproduce its interface pixel-for-pixel. Bunyip Box must have its own visual identity while preserving the functional clarity of a modern analytics dashboard.

| **Core product promise:** Bunyip Box should make it easy to answer: What are the best-performing posts being published by the Pages I care about, and which of those posts should I save for future content research? |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

# 2. Product semantics and definitions

## 2.1 What a selected date range means

Date filtering is based on when a Facebook post was published, using the post created_time returned by Meta. For example, Last 7 Days means posts whose published timestamp falls within the selected seven-day window in the user's configured timezone.

Engagement values shown for those posts are the latest known lifetime engagement totals currently stored by Bunyip Box, not engagement that occurred only inside the selected date range. Therefore, a Page total for Last 7 Days means the sum of the latest known metrics for posts that Page published during the last seven days.

## 2.2 Page-authored content only

The MVP is intended to ingest posts published by the tracked Facebook Page itself. Do not ingest visitor posts, commenter identities, comment text, private messages, or unrelated audience data unless a future requirement explicitly adds those capabilities and the verified Meta API permits them.

## 2.3 Unavailable is not zero

If Meta does not return a metric or field for a post, store and display that value as unavailable/null rather than silently converting it to zero. Zero means the API explicitly returned zero. Unavailable means the metric could not be retrieved or is not supported for that record.

## 2.4 Terminology for likes and reactions

Do not hard-code a misleading metric name. Internally, use field names that match the verified Meta data, such as reaction_count when appropriate. The UI may label the metric Likes only if the verified endpoint actually represents likes in the intended sense; otherwise use Reactions or the accurate Meta terminology.

## 2.5 Total Engagement

The intended formula is reactions/likes + comments + shares when all three component metrics are reliably available. If a required component is unavailable for a post, do not treat the missing value as zero. Mark Total Engagement as unavailable for that post unless the product owner later approves a clearly labeled partial-engagement formula.

# 3. Scope and exclusions

## 3.1 Included in MVP

- Secure private authentication and owner bootstrap flow.

- User-created lists of tracked Facebook Pages.

- Meta-supported Page lookup/input and Page metadata.

- Asynchronous historical ingestion and incremental synchronization.

- Post and Page analytics for selectable publication date ranges.

- Sorting, filtering, text search, and Top Posts views.

- Simple percentile-based post grades as a visual cue.

- Saved Posts with optional private notes.

- CSV export of the complete filtered result set.

- Data freshness indicators, failed-sync visibility, retry controls, and a protected System Status screen.

- Cloud staging and production deployments with automated checks.

## 3.2 Explicitly out of scope

- Facebook scheduling or publishing.

- Instagram, X/Twitter, LinkedIn, Pinterest, TikTok, or other social networks.

- AI caption/post generation or rewriting.

- Billing, subscriptions, payment processing, or plan enforcement.

- Teams, organizations, role hierarchies, or shared workspaces.

- Email sending, transactional email, or email verification.

- Native iOS or Android applications.

- Scraping or browser automation as a fallback for unavailable Meta API capabilities.

# 4. Technology and architecture

| **Layer**            | **Requirement**                                     |
|----------------------|-----------------------------------------------------|
| Web application      | Next.js + TypeScript                                |
| Database             | PostgreSQL                                          |
| ORM                  | Prisma                                              |
| Authentication       | Secure credentials-based sessions                   |
| Web hosting          | DigitalOcean App Platform service                   |
| Background ingestion | DigitalOcean App Platform worker                    |
| Scheduling           | DigitalOcean scheduled jobs that enqueue sync work  |
| Durable job state    | PostgreSQL-backed sync_jobs table / queue semantics |
| Source control       | GitHub                                              |
| Development          | OpenAI Codex working against the GitHub repository  |

The application must run completely in DigitalOcean. The owner does not intend to establish or maintain a local development environment. Browser-accessible staging and production environments are therefore part of the implementation, not optional later improvements.

> OpenAI Codex
> → GitHub repository
> → Staging App Platform deployment
> → Production App Platform deployment
> Meta Graph API
> → Scheduled job enqueues work
> → Background worker processes durable jobs
> → PostgreSQL
> → Bunyip Box dashboard / exports


## 4.1 Architecture principles

- The web application must never depend on a browser tab remaining open for ingestion.

- Interactive dashboard views must query PostgreSQL, not repeatedly call Facebook in real time.

- Facebook-specific logic must live behind a service layer so API versions and fields can be changed without rewriting the product UI.

- Long-running ingestion work must be resumable, idempotent, observable, and isolated by Page.

- Do not introduce Redis, Kafka, Kubernetes, Elasticsearch, or microservices for MVP unless a concrete verified requirement makes them necessary.

# 5. Environments, domain, and canonical URLs

## 5.1 Required environments

| **Environment** | **Purpose**                                                                  | **Data**                                                           |
|-----------------|------------------------------------------------------------------------------|--------------------------------------------------------------------|
| Staging         | Codex verification, smoke testing, migration testing, Meta development tests | Separate staging database; never share production data by default. |
| Production      | Owner's live Bunyip Box application                                          | Production database and production-approved Meta credentials.      |

Use separate DigitalOcean App Platform applications or otherwise fully isolated app/database resources for staging and production. Staging must not be capable of accidentally mutating the production database.

## 5.2 When to connect the purchased domain

| **Domain timing:** Connect the custom Bunyip Box domain immediately after the first minimal production Next.js deployment succeeds on the DigitalOcean starter URL. Verify DNS and HTTPS before production authentication and Meta integration URLs are treated as final. |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

Recommended hostname strategy: use an app subdomain for the product and leave the apex/root domain available for a future marketing site. If the purchased domain is bunyipbox.com, use https://app.bunyipbox.com as the canonical application URL. The exact purchased domain must be confirmed with the owner before DNS changes are made.

Once the custom hostname is active, define APP_URL (or the chosen equivalent) from that canonical HTTPS URL. Authentication redirects, secure cookies, CSRF origin checks, OAuth/callback URLs if later required, and any Meta configuration that depends on a public URL must reference the canonical URL rather than the temporary DigitalOcean hostname.

The staging environment may remain on its DigitalOcean starter hostname for MVP unless a stable staging hostname becomes necessary. Do not expose staging through the primary production domain.

## 5.3 Business Identity, Branding, and Meta Verification

Bunyip Box is the customer-facing product/brand. Bunyip Box is not a separate legal entity. The company that owns and operates the product is Hawker Works LLC. This relationship is a permanent application requirement and must remain consistent across branding, legal pages, Meta configuration, repository documentation, and future compliance functionality.

### Product and legal identity

- Product/app name: Bunyip Box.

- Legal business/entity name: Hawker Works LLC.

- Do not represent Bunyip Box as a separate incorporated company, legal entity, or business owner.

- Centralize the legal entity name and product name in application configuration/constants where practical so public surfaces do not drift into inconsistent wording.

### Branding and visible ownership

Throughout the normal application UI, use Bunyip Box as the primary brand. Users should generally see Bunyip Box rather than Hawker Works LLC except where legal ownership, compliance, billing/contact identity, or business verification is relevant.

The public website and appropriate authenticated application pages must include a visible footer using substantially the following ownership language: © {current year} Hawker Works LLC. Bunyip Box is a product of Hawker Works LLC. Generate the year dynamically where practical rather than hard-coding 2026.

### Public legal and compliance pages

The following pages must be publicly accessible without authentication and available from the canonical Bunyip Box domain/hostname so they can be supplied to Meta during app configuration, business verification, or App Review where required:

- Privacy Policy - clearly state that Bunyip Box is a product and service owned and operated by Hawker Works LLC. A suitable opening formulation is: Bunyip Box ("Bunyip Box," "we," "us," or "our") is a product and service owned and operated by Hawker Works LLC.

- Terms of Service - identify Hawker Works LLC as the legal entity providing and operating Bunyip Box.

- Data Deletion Instructions - explain how a user can request deletion of a Bunyip Box account and associated data. The page must be viewable without logging in and suitable for submission to Meta where required.

Use stable routes such as /privacy, /terms, and /data-deletion on the canonical application hostname (for example, app.bunyipbox.com) unless a future public root-domain site intentionally becomes the canonical host for these documents.

### Meta Business Verification and app configuration

When configuring Meta for Developers, Meta Business Verification, or App Review, use the business relationship consistently:

- Legal business name: Hawker Works LLC.

- Product/app public-facing name: Bunyip Box.

- Submit official business documentation for Hawker Works LLC when Meta requests legal-entity evidence.

- Where Meta asks for the app or product name, use Bunyip Box. Where Meta asks for the legal company/entity name, use Hawker Works LLC.

- The Bunyip Box website must visibly establish that Bunyip Box is owned and operated by Hawker Works LLC.

- Business contact information supplied to Meta must be legitimate and consistent with Hawker Works LLC business information.

- Do not invent, alter, or fabricate business information in an attempt to make Bunyip Box appear to be a separate legal entity.

### Domain and business email

Once the Bunyip Box domain is connected, use the canonical domain/hostname for the home/login experience and the public Privacy Policy, Terms of Service, and Data Deletion Instructions pages. If a domain-based business email address is established, use it where appropriate for Meta configuration, support contact information, and compliance pages. Do not invent an email address before one actually exists.

### Permanent implementation rule

Bunyip Box is the product/brand. Hawker Works LLC is the company that owns and operates it. Codex must treat this relationship as permanent and reflect it consistently in legal pages, footer information, Meta integration documentation, application metadata, and any future compliance-related functionality.

# 6. Codex onboarding and DigitalOcean setup

The owner has GitHub and uses Codex but may not yet have the required DigitalOcean resources. Codex must not assume infrastructure exists. When an external action is required, give simple, sequential click-by-click instructions and confirm what the owner should see before proceeding.

## 6.1 Required setup sequence

1. Create or confirm the DigitalOcean account.

2. Create a DigitalOcean project named for Bunyip Box.

3. Connect DigitalOcean to the GitHub repository.

4. Create the production App Platform application and deploy a minimal working Next.js application to the DigitalOcean starter URL.

5. Verify the minimal production deployment is healthy.

6. Connect the purchased Bunyip Box custom domain, configure DNS, verify HTTPS, and establish the canonical APP_URL.

7. Publish the unauthenticated Privacy Policy, Terms of Service, and Data Deletion Instructions pages on the canonical Bunyip Box hostname.

8. Add the visible Hawker Works LLC ownership footer and verify that the public site clearly establishes Bunyip Box as a product of Hawker Works LLC.

9. Create the staging App Platform application from the chosen staging branch and verify it independently.

10. Provision separate PostgreSQL resources/databases for production and staging.

11. Configure encrypted environment variables and secrets separately in each environment.

12. Configure Prisma migrations as a safe pre-deploy operation.

13. Add the background worker and scheduled job components required by the ingestion architecture.

14. Document the full GitHub → staging → production flow, public compliance URLs, and business identity relationship in README.md.

Use the smallest practical DigitalOcean resources initially. The design must allow web compute, database capacity, and background processing to scale independently later.

# 7. Secrets and configuration

Never commit secrets, credentials, private tokens, or .env files to GitHub. Use DigitalOcean encrypted environment variables or equivalent secure secret handling. Keep production and staging credentials separate.

| **Variable**           | **Purpose**                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| DATABASE_URL           | Environment-specific PostgreSQL connection string.                          |
| AUTH_SECRET            | High-entropy secret for the chosen authentication/session implementation.   |
| APP_URL                | Canonical URL for the current environment.                                  |
| META_APP_ID            | Meta app identifier.                                                        |
| META_APP_SECRET        | Meta app secret; server-side only.                                          |
| META_ACCESS_TOKEN      | Only if the verified Meta flow requires a long-lived/configured token.      |
| META_GRAPH_API_VERSION | Explicitly pinned Graph API version used by the service layer.              |
| SYNC_INTERVAL_MINUTES  | Configuration for intended regular sync cadence; initial target 30 minutes. |
| BACKFILL_DAYS          | Initial historical backfill window; initial default 90 days.                |
| DEFAULT_TIMEZONE       | Initial default America/Chicago.                                            |

Never expose META_APP_SECRET, Meta access tokens, database credentials, or AUTH_SECRET to browser JavaScript. Never print access tokens or secrets in application logs, sync errors, or debugging output.

# 8. Authentication, account model, and user ownership

## 8.1 Owner bootstrap

Because Bunyip Box is initially a private application, do not leave unrestricted public signup permanently enabled. When the user table is empty, provide a one-time Create Owner Account flow with Name, Email, Password, and Confirm Password. After the first owner account is created, disable open public registration by default.

If another account is needed during MVP, use an explicit protected administrative creation procedure. Email invitations and email verification remain out of scope.

## 8.2 Login and sessions

- Login with email and password.

- Passwords must be hashed using a current established password-hashing library.

- Use secure HTTP-only cookies with appropriate Secure and SameSite settings in production.

- Provide a persistent remembered authenticated session.

- Logout must invalidate the authenticated session and return the user to login.

- Rate-limit repeated failed login attempts or otherwise implement a practical brute-force defense.

## 8.3 Password reset

Do not build an email-based password-reset flow in MVP because email infrastructure is intentionally excluded. Document a safe administrative/manual reset procedure for the initial private deployment.

## 8.4 User-owned versus shared data

Lists, saved posts, private notes, and user preferences such as timezone are user-owned records and must include user ownership/authorization checks. Facebook Page and Facebook post records should be globally deduplicated in the database so the same public Page or post is not stored repeatedly for different lists or users.

## 8.5 Timezone preference

Add a minimal Settings screen or equivalent profile setting for timezone. Default to America/Chicago. Date boundaries for Today, Yesterday, Last 7 Days, and custom dates must use the user's configured timezone while timestamps in the database should be stored in UTC.

# 9. Lists dashboard

After login, land on a Lists Dashboard. Display the number of unique Facebook Pages currently tracked for the authenticated user and all user-created lists. Do not impose an artificial list or Page-count limit in application logic.

Example lists include Country Music, Nashville, Michigan, Tennessee News, and Competitors.

## 9.1 List operations

- Create list

- Rename list

- Delete list with confirmation

- Open list

Deleting a list must not delete the underlying Facebook Page or historical post data if that Page is used by another list or user. User-visible membership is removed; shared source data remains governed by the Page lifecycle rules in Section 10.3.

## 9.2 List summary metrics

For the selected publication period, a list may show number of Pages, total reactions/likes, total comments, total shares, number of posts, and top-performing Page. Metrics must be computed from data stored in PostgreSQL and must follow the date and missing-value semantics in Section 2.

# 10. Adding and managing Facebook Pages

Inside a list, provide Add Page to Track. The desired experience is to search for a Facebook Page, select it, and add it to the list. The exact lookup mechanism must only be implemented if the verified Meta app/token supports it. If general Page search is unavailable, implement the closest compliant flow such as a verified Facebook Page URL or Page ID lookup.

Where available through the verified API, store/display Page name, profile image, Facebook Page ID, follower count, and other necessary public metadata. Do not claim a field is supported until the exact endpoint and permission are proven.

## 10.1 Shared Page records

A Facebook Page may belong to multiple lists. Use a single underlying facebook_pages record with a many-to-many list_pages relationship. Synchronize that Page once globally per required cadence, not once per list.

## 10.2 Remove Page from list

Removing a Page from a list requires confirmation. It must not remove the Page from other lists or delete historical data.

## 10.3 Page synchronization lifecycle

If a Page is removed from its final active list, retain its historical Page/post records but mark the Page inactive for synchronization. Stop scheduled refreshes for that Page. If the Page is later added to a list again, reactivate synchronization and resume from the stored state rather than duplicating the Page or re-creating existing posts.

# 11. Meta API implementation gates

Do not implement scraping as a fallback. Use the official Meta Graph API only. Facebook integration has two required gates: a development capability gate and a production eligibility gate.

## 11.1 Gate A - development capability

1. Register or confirm the Meta developer profile.

2. Create the Meta App and choose the appropriate current app type/use case.

3. Obtain the App ID and App Secret.

4. Pin an explicit supported Meta Graph API version in configuration.

5. Open Graph API Explorer or the current equivalent official testing tool.

6. Request/test the permissions required for Bunyip Box.

7. Generate a development access token using a supported flow.

8. Manually test the exact endpoints needed for Page lookup, Page metadata, Page-authored posts, and engagement metrics.

9. Confirm exactly which fields Meta returns for public Pages the owner does not manage.

10. Record a sanitized sample successful request and response for each required capability.

11. Record failure responses for at least invalid token, unavailable Page, and permission denial.

## 11.2 Gate B - production eligibility

Before a Facebook capability is considered production-ready, Codex must verify the current production access requirements for the chosen app configuration, including any App Review, advanced access, business verification, data-handling, privacy, legal-page, or token requirements that apply. A call working in a development tool is not by itself proof that the deployed Bunyip Box application may use the capability in production.

For Meta business identity and verification, use Bunyip Box as the public-facing product/app name and Hawker Works LLC as the legal business/entity name. Submit legal-entity documentation for Hawker Works LLC, keep business contact information consistent with that company, and verify that the Bunyip Box public site visibly states the ownership relationship before submitting review/verification materials.

If a required capability cannot be approved or used in the intended private deployment, report the limitation clearly and adapt the product requirement rather than circumventing Meta controls.

## 11.3 Verification record

Maintain a short repository document, for example docs/meta-capabilities.md, listing each required capability, tested API version, endpoint, required permission, token type, example response shape, production-access status, and date last verified. This document should be updated when Meta behavior changes.

# 12. Ingestion and job architecture

Bunyip Box must maintain its own PostgreSQL copy of the relevant Facebook dataset. The application should not repeatedly call Facebook during normal dashboard browsing.

> DigitalOcean scheduled job
> → enqueue durable sync_jobs rows
> → DigitalOcean background worker
> → lease one job
> → Meta Graph API calls
> → upsert Page / posts / metrics / snapshots
> → complete or retry job


## 12.1 Durable job requirements

- Job state must survive web deploys, worker restarts, and process crashes.

- Use a PostgreSQL-backed sync_jobs model or equivalent durable database queue rather than in-memory-only jobs.

- A job must include job type, Page ID where applicable, status, attempt count, creation time, next eligible attempt, lease/lock information, progress/checkpoint metadata, and last error summary.

- Workers must claim jobs atomically so two workers cannot process the same job concurrently.

- Use a Page-level synchronization lock or lease so a historical backfill and incremental sync cannot update the same Page concurrently in conflicting ways.

- Expired leases must allow safe recovery after crashes.

- Retries must be idempotent: reprocessing the same Page/cursor may update existing records but must not create duplicate posts or snapshots merely because of a retry.

## 12.2 Sync run history

Record each meaningful synchronization run with start/end times, job/run ID, Page ID, sync type, success/failure status, records fetched/updated where practical, and a sanitized error summary. Structured application logs should include the run/job identifiers for correlation but must never contain secrets.

# 13. Initial historical backfill

Adding a new Page initiates an asynchronous historical backfill. The Page must appear in the UI immediately while ingestion continues in the background. The user must be able to navigate away, close the browser, or deploy a new web version without losing the queued import.

Default requested historical backfill window: last 90 days, subject to what the verified Meta API permits. Architect the configuration so 30 days, 90 days, 6 months, or 1 year can be supported later without redesigning ingestion.

Historical ingestion must follow Meta pagination and rate limits. Persist the relevant pagination/checkpoint state so a partially completed import can resume rather than start from the beginning after a transient failure.

| **Status** | **Meaning**                                                                                                             |
|------------|-------------------------------------------------------------------------------------------------------------------------|
| Queued     | Waiting for durable background ingestion.                                                                               |
| Importing  | Historical posts are actively being fetched and stored.                                                                 |
| Ready      | Initial backfill completed successfully; periodic sync continues.                                                       |
| Failed     | Import stopped after retry policy; diagnostic information is preserved and manual retry is available.                   |
| Inactive   | Page is retained historically but is not currently assigned to an active list and is not scheduled for routine refresh. |

# 14. Incremental synchronization and metric refresh

After initial ingestion, do not repeatedly re-download the full history. Incremental synchronization should retrieve newly published posts and refresh engagement metrics on recent tracked posts.

## 14.1 Initial MVP cadence

- Approximately every 30 minutes: enqueue active Pages for new-post discovery and refresh metrics for posts published within the most recent 7 days.

- Daily reconciliation: re-check active Page metadata and refresh older posts within the retained/backfilled 90-day window so missed updates and transient failures are corrected.

- Keep all age windows and cadences configurable so they can be tuned to real Meta rate limits and DigitalOcean cost/performance.

The 30-minute cadence is a target, not permission to violate Meta rate limits. If current DigitalOcean scheduling behavior or Meta limits require a different implementation, Codex must document the reason and preserve approximately the same freshness goal where practical.

## 14.2 Retry and rate limiting

- A failure for one Page must not stop other Pages from syncing.

- Honor current Meta rate-limit signals and Retry-After behavior where provided.

- Use bounded exponential backoff with jitter for transient failures.

- Do not aggressively retry permission errors or invalid tokens as if they were transient network failures.

- Expose a manual retry for failed Page ingestion/sync where safe.

## 14.3 Metric refresh history limitation

Bunyip Box can measure engagement growth only from the moment it first observed a post. It cannot reconstruct historical engagement velocity from before tracking began unless Meta explicitly provides that historical series. Future velocity features must make this limitation clear.

# 15. Facebook Page and post data

## 15.1 Page record

Store only fields actually returned by the verified API and useful to the product. Intended Page fields include facebook_page_id, name, profile image URL, follower count when available, active_sync flag/status, first_tracked_at, last_successful_sync_at, and latest metadata sync time.

## 15.2 Post record

| **Field**              | **Requirement**                                                       |
|------------------------|-----------------------------------------------------------------------|
| facebook_post_id       | Unique stable Meta identifier; must have a unique constraint.         |
| facebook_page_id       | Foreign key to the single underlying Page record.                     |
| message                | Nullable post text/caption.                                           |
| created_time           | Published timestamp returned by Meta; store normalized UTC timestamp. |
| permalink              | Nullable original Facebook URL.                                       |
| post_type              | Nullable/verified type returned by Meta.                              |
| attachment metadata    | Nullable image/thumbnail/attachment information returned by Meta.     |
| reaction_count / likes | Nullable; name and meaning must match verified API.                   |
| comment_count          | Nullable.                                                             |
| share_count            | Nullable.                                                             |
| availability_status    | Available, unavailable/deleted, or another verified state.            |
| first_seen_at          | When Bunyip Box first stored the post.                                |
| last_synced_at         | When the post was last successfully refreshed.                        |
| unavailable_at         | Timestamp if the post later becomes unavailable.                      |

Do not assume every post contains text, an image, comments, shares, or every desired metric. The database and UI must handle null fields gracefully. Repeated synchronization must upsert by Facebook post ID rather than create duplicates.

Use integer types large enough for large public Pages and viral posts. Avoid schema choices that could overflow normal 32-bit engagement counts over the life of the application.

# 16. Historical metric snapshots

Do not only overwrite the latest engagement totals. Store periodic snapshots for tracked posts so future features can measure velocity and growth from the time tracking began.

> post_metric_snapshots
> - post_id
> - reaction_count / likes (nullable)
> - comment_count (nullable)
> - share_count (nullable)
> - captured_at


Store a baseline snapshot on first observation. After that, avoid excessive identical snapshots when no metric changed if doing so materially reduces unnecessary storage. The current post record should always retain the latest known values even if an unchanged snapshot is skipped.

# 17. List detail screen

Opening a list displays its tracked Pages and performance for the currently selected publication date range.

| **Page**             | **Followers** | **Reactions/Likes** | **Comments** | **Shares** | **Posts** | **Sync** |
|----------------------|---------------|---------------------|--------------|------------|-----------|----------|
| Taste of Country     | 2.3M          | 1.2M                | 108.7K       | 54.9K      | 682       | Ready    |
| Country Music Nation | 6.3M          | 558K                | 50K          | 33.5K      | 646       | Ready    |
| Whiskey Riff         | 2.4M          | 240K                | 28K          | 13K        | 740       | Ready    |

The numbers above are illustrative UI examples only; do not seed or hard-code them as application data.

## 17.1 Date selection

- Today

- Yesterday

- Last 7 Days

- Last 30 Days

- Last 90 Days

- Custom start and end dates

Default date range: Last 7 Days. Use the authenticated user's configured timezone for date boundaries. Initial default timezone: America/Chicago.

## 17.2 Page sorting

Allow sorting Pages by available reactions/likes, comments, shares, Total Engagement when valid, or Posts. Default to the primary reaction/like metric descending. Clicking the same sort can reverse direction. Unavailable metric values sort after known values, not as zeros.

# 18. Top Posts

Provide a prominent Top Posts action from a list. It displays actual posts from Pages belonging to that list whose published timestamps fall within the selected date range.

## 18.1 Sorting and filters

- Reactions/Likes

- Comments

- Shares

- Total Engagement when available

- Newest

Default to the primary reaction/like metric descending. Use deterministic secondary ordering such as facebook_post_id or created_time so pagination does not reshuffle ties between requests.

## 18.2 Search

Provide text search across post text and Page name within the selected list/date context. Search operates against the stored PostgreSQL dataset.

## 18.3 Post card

Each result should show the Page profile picture, Page name, published date/time, post text, image/thumbnail when available, available engagement metrics, simple grade badge, saved/bookmark control, and a link to the original Facebook post. Missing metrics should display as unavailable rather than zero.

# 19. Simple post grade

Do not recreate a complicated or proprietary scoring algorithm. The grade is a lightweight visual cue only and must be easy to change or remove later.

Initial rule: calculate percentile within the currently selected result set using the active ranking metric. Only posts with a known value for that metric participate in percentile grading; posts with an unavailable value show no grade for that ranking.

| **Grade** | **Percentile band** |
|-----------|---------------------|
| A+        | Top 5%              |
| A         | Next 10%            |
| B         | Next 20%            |
| C         | Next 30%            |
| D         | Remainder           |

If the user sorts by Shares, the grade reflects shares. If sorted by Comments, it reflects comments. Keep the implementation modular and testable.

# 20. Saved Posts

Because the primary purpose is curation, provide a bookmark/save action on every post. Add a Saved Posts screen where the authenticated user can revisit saved items.

Allow an optional private note on a saved post, for example: Good Nashville To Do article idea - research this.

A saved item must retain a relationship to the stored Facebook post rather than duplicating the entire post record. Saved state and notes are user-owned and must not be visible to other users unless a future collaboration feature explicitly adds sharing.

# 21. Search, pagination, and performance

Do not load thousands of posts into the browser at once. Use server-side pagination or an equivalent scalable server-side query strategy.

Default: 50 posts per page. Options: 25, 50, 100.

Core queries must be indexed for posts from Pages in List X, published between dates Y and Z, ordered by the chosen metric. At minimum, index Facebook post ID, Facebook Page ID, created_time, available engagement fields, list membership joins, and user/list ownership keys.

Pagination queries must have deterministic secondary ordering. If early scale makes offset pagination acceptable, keep the data-access layer structured so it can move to cursor/keyset pagination without rewriting the UI contract.

Do not add a separate search engine in MVP. Start with PostgreSQL search capabilities and add specialized search infrastructure only if measured performance requires it.

# 22. CSV export

Provide Download CSV. Export all posts matching the currently selected list, date range, search/filter criteria, and relevant sort context, not only the currently visible pagination page.

| **Column**       | **Notes**                                        |
|------------------|--------------------------------------------------|
| Page Name        | Stored Page name                                 |
| Facebook Page ID | Source Page ID                                   |
| Post Date        | Published timestamp formatted consistently       |
| Post Text        | Nullable text                                    |
| Post Type        | Verified source value when available             |
| Reactions/Likes  | Blank when unavailable                           |
| Comments         | Blank when unavailable                           |
| Shares           | Blank when unavailable                           |
| Total Engagement | Blank when unavailable under the defined formula |
| Facebook URL     | Original permalink when available                |
| Image URL        | API-provided media URL when available            |

CSV generation must correctly escape commas, quotation marks, line breaks, and other caption content. It must also neutralize spreadsheet formula injection: text fields beginning with formula-trigger characters such as =, +, -, or @ must be safely escaped so opening the CSV in spreadsheet software does not execute post content as a formula.

Generate large CSV exports server-side without loading the entire dataset into browser memory. Prefer streaming or bounded-memory generation. Use descriptive filenames such as country-music_2026-09-01_2026-09-26.csv.

# 23. Data freshness and system status

Always make data freshness visible so stale API data is not mistaken for poor post performance.

- Show Last updated: X minutes ago for Pages or relevant views.

- Show a clear failed-sync state and concise human-readable error category.

- Allow retry where practical.

- Show a list/view-level Data updated indicator based on relevant Page sync state.

- Never silently present stale data as current.

## 23.1 Protected System Status screen

Provide an authenticated owner/admin System Status screen. It should show the configured Meta Graph API version, Meta connection/token health at a safe summary level, last successful scheduled enqueue run, number of queued/running/failed jobs, Pages currently importing, recent sync failures, and manual retry controls where appropriate.

Do not display secrets, raw access tokens, app secret values, database credentials, or excessive raw response bodies on this screen.

# 24. Data retention, unavailable content, and images

## 24.1 Retention

Keep collected Page, post, and metric history indefinitely for MVP unless current legal/API requirements require otherwise. Historical retention is a core benefit of maintaining Bunyip Box's own dataset.

## 24.2 Deleted or unavailable Facebook content

If Meta stops returning a post or Page that was previously stored, do not immediately delete the local record. Mark it unavailable/removed, retain its last known historical metrics and timestamps, and show an unavailable state in the UI. Do not repeatedly treat the missing record as a brand-new error on every sync.

## 24.3 Images and attachment URLs

Do not automatically duplicate every Facebook image into DigitalOcean object storage in MVP. Store API-provided image/attachment URLs where permitted. If those URLs are temporary or unsuitable for historical display, document the observed behavior and obtain approval before implementing a separate media-copy/storage strategy.

# 25. Responsive design, accessibility, and UX

Primary target is desktop. The application should remain usable on tablet/mobile, but a specialized native/mobile UI is not required for MVP.

Use the supplied Strevio screenshots only as functional references for hierarchy: list overview, list detail, Top Posts, date selection, sorting controls, post cards, and metrics. The resulting interface must use Bunyip Box branding and its own visual identity.

## 25.1 Baseline accessibility

- Use semantic headings, labels, buttons, links, and table markup.

- All primary actions and navigation must be keyboard accessible.

- Provide visible focus states and sufficient color contrast.

- Do not rely on color alone to communicate sync errors, grades, or selected states.

- Images used as content should have appropriate alt text when meaningful; decorative imagery should not create noise for assistive technology.

- Forms must expose validation errors in text and associate errors with their fields.

# 26. Minimum database model

The exact Prisma schema may evolve during implementation, but the MVP must support at least the following conceptual records and relationships.

| **Model**             | **Purpose / key constraints**                                                               |
|-----------------------|---------------------------------------------------------------------------------------------|
| users                 | Owner/user identity, email unique, password hash, timezone, timestamps.                     |
| sessions              | If required by chosen auth implementation; securely associated with users.                  |
| lists                 | User-owned list with name and timestamps.                                                   |
| facebook_pages        | Single deduplicated record per Facebook Page ID; metadata and sync lifecycle.               |
| list_pages            | Many-to-many membership; unique list_id + facebook_page_id.                                 |
| facebook_posts        | Single deduplicated record per Facebook post ID; latest known metrics and availability.     |
| post_metric_snapshots | Historical metric observations by post and captured_at.                                     |
| saved_posts           | User + post relationship with optional private note; unique user_id + post_id.              |
| sync_jobs             | Durable queue/lease/checkpoint state for background work.                                   |
| sync_runs             | Auditable run summary with Page/job/type/status/timing.                                     |
| sync_errors           | Sanitized meaningful error details associated with jobs/runs.                               |
| system_settings       | Optional server-side settings only if configuration cannot remain in environment variables. |

Use proper foreign keys, unique constraints, timestamps, and indexes. Authorization queries must include user ownership where appropriate. Source-data records may be globally shared, but user-specific relationships must never leak across accounts.

For sortable Total Engagement, use an efficient database/query implementation appropriate to PostgreSQL. Do not repeatedly compute expensive unindexed expressions over an unbounded result set if a generated/stored value or suitable index is warranted by measured scale. Preserve null semantics when any required component is unavailable.

# 27. Security requirements

- Hash passwords with a current established password-hashing library and safe parameters.

- Use secure HTTP-only session cookies and appropriate SameSite/Secure settings.

- Protect every authenticated route and enforce authorization server-side, not only in the UI.

- Implement CSRF protection where applicable to the chosen authentication architecture.

- Validate server-side input with a consistent schema-validation approach.

- Escape rendered user/API text appropriately to prevent XSS.

- Never expose Meta secrets, access tokens, database credentials, or AUTH_SECRET to the client.

- Never commit .env files or credentials.

- Use HTTPS in production.

- Use least-privilege access for database and API credentials where practical.

- Rate-limit or otherwise protect authentication endpoints from brute-force abuse.

- Avoid logging raw request bodies when they may contain secrets.

- Keep dependencies patched and use automated dependency/security alerts available through GitHub.

# 28. Testing and CI

Codex must not treat a page rendering in the browser as sufficient proof of correctness. The repository must include automated checks appropriate to the application.

## 28.1 Required automated checks

- Formatting/lint checks.

- TypeScript type checking.

- Unit tests for date-window calculations, engagement aggregation, grade boundaries, missing-metric behavior, and CSV escaping/formula neutralization.

- Integration tests for list ownership/authorization, save/unsave behavior, Page lifecycle, and database upserts.

- Ingestion tests proving idempotency, checkpoint/resume behavior, retry handling, and no duplicate posts after repeated syncs.

- Authentication tests for owner bootstrap, login, protected routes, logout, and disabled public signup after bootstrap.

- A small end-to-end smoke test covering login → list → Page shell → Top Posts using test fixtures or staging-safe data.

## 28.2 Meta test strategy

Do not make the test suite depend on live Facebook calls. Keep Meta code behind the service layer and test most behavior with sanitized response fixtures captured from verified official API calls. Maintain a small manual staging verification checklist for live Meta behavior when permissions or API versions change.

## 28.3 CI gate

GitHub pull requests intended for merge must run lint, type checking, and automated tests. A failing required check should block the normal promotion path until corrected.

# 29. Deployment, migrations, and backups

## 29.1 Branch/deployment flow

> Codex feature branch
> → Pull Request / automated checks
> → develop
> → DigitalOcean staging deployment
> → smoke test
> → release PR develop → main
> → pre-deploy migration
> → production deployment


If Codex proposes a simpler GitHub branching model, it may do so only if staging remains a real isolated deployment and production changes still pass automated checks and an intentional promotion step. Do not make production the default experimental environment.

## 29.2 Prisma migrations

Use Prisma migrations. Deployments must not require the owner to manually execute ad-hoc SQL. Apply production/staging migrations through a documented pre-deploy job such as prisma migrate deploy so schema changes run once in a controlled deployment phase rather than opportunistically on every web process startup.

## 29.3 Backups and restore

Before calling the application production-ready, Codex must inspect the actual selected DigitalOcean PostgreSQL tier and document what backups are included, retention, what is not protected, how restoration works, and whether an additional export/backup process is recommended. Do not assume all tiers have the same backup behavior.

Perform at least one staging restore or recovery rehearsal before declaring backup/restore documentation complete. The goal is to prove the documented procedure is usable, not merely that a backup option exists in a control panel.

## 29.4 README requirements

The repository README.md must cover architecture, staging/production URLs, required environment variables, domain/DNS setup, public Privacy Policy/Terms/Data Deletion URLs, the permanent Bunyip Box → Hawker Works LLC ownership relationship, DigitalOcean deployment, database migrations, Meta capability verification, ingestion/job architecture, test/CI workflow, troubleshooting, backup/restore procedures, and how to change sync configuration safely.

# 30. MVP acceptance criteria

1. Open the production Bunyip Box custom HTTPS URL.

2. Open the public Privacy Policy without authentication and verify it identifies Bunyip Box as a product and service owned and operated by Hawker Works LLC.

3. Open the public Terms of Service without authentication and verify Hawker Works LLC is identified as the legal entity providing and operating Bunyip Box.

4. Open the public Data Deletion Instructions without authentication and verify it explains how a user can request deletion of the Bunyip Box account and associated data.

5. Verify the public site/app footer visibly states that Bunyip Box is a product of Hawker Works LLC and uses a dynamically generated current year where practical.

6. On a fresh database, create the one-time owner account without email verification.

7. Verify public owner signup is no longer available after bootstrap.

8. Log in and remain authenticated across a normal browser revisit.

9. Set or confirm the user timezone.

10. Create a list called Country Music.

11. Add three Facebook Pages using the Meta-supported lookup/input flow.

12. Verify one underlying Facebook Page record is reused if the same Page is added to another list.

13. See each newly tracked Page enter Queued/Importing and later Ready state while historical ingestion happens asynchronously.

14. Close or navigate away from the browser during an import and verify the import continues.

15. Restart/redeploy the web application during a queued/importing scenario and verify durable job state is not lost.

16. See the last successful data refresh time.

17. Open Country Music and select Last 7 Days.

18. Verify the date range selects posts by published date using the configured timezone.

19. Sort Pages by available engagement metrics and Posts.

20. Open Top Posts and see actual stored Facebook posts and available engagement metrics.

21. Sort posts by Reactions/Likes, Comments, Shares, Total Engagement where valid, and Newest.

22. Verify missing metrics display as unavailable rather than zero.

23. Search post text and Page name.

24. Save a post and add an optional private note.

25. Open the original post on Facebook when a permalink is available.

26. Export all matching posts for the selected timeframe to CSV.

27. Verify the export includes the complete filtered result set, not just the visible page.

28. Verify CSV formula-triggering post text is neutralized safely.

29. See a useful failed-sync state and retry option when a Page sync fails.

30. See queued/running/failed job information on the protected System Status screen.

31. Remove a Page from one list and verify it remains active if another list still uses it.

32. Remove a Page from its final list and verify historical data remains while routine sync becomes inactive.

33. Log out and verify protected routes are no longer accessible.

34. Return later and find lists, saved posts, notes, and historical data intact.

35. Verify staging and production use separate databases and secrets.

36. Verify required CI checks pass before the production promotion.

37. Verify the documented backup/restore procedure in staging.

# 31. Build order

| **Milestone**               | **Scope**                                                                                                                                                                                                                                                        |
|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1\. Infrastructure + domain | GitHub repo, DigitalOcean project, minimal production Next.js deployment, custom Bunyip Box domain + HTTPS, public Privacy Policy/Terms/Data Deletion pages, Hawker Works LLC ownership footer, staging app, deployment documentation.                           |
| 2\. Foundation              | Separate PostgreSQL environments, Prisma, pre-deploy migrations, authentication, owner bootstrap, timezone setting, core database model.                                                                                                                         |
| 3\. Lists/UI                | Lists dashboard, list CRUD, Page-management shell, responsive Bunyip Box visual identity.                                                                                                                                                                        |
| 4\. Meta proof of concept   | Guide owner through Meta Developer setup. Use Bunyip Box as the product/app name and Hawker Works LLC as the legal business. Prove development capabilities, business/production eligibility, and required public compliance surfaces before coding integration. |
| 5\. Job system + ingestion  | Durable sync_jobs, worker, scheduled enqueuing, 90-day backfill, checkpoints, statuses, incremental sync, snapshots, retry/error logging.                                                                                                                        |
| 6\. Curation UI             | List analytics, date ranges, sorting, Top Posts, search, grades, Saved Posts, null/unavailable metric treatment.                                                                                                                                                 |
| 7\. Export                  | Server-side complete filtered CSV export with correct escaping and formula-injection protection.                                                                                                                                                                 |
| 8\. Operations              | System Status screen, freshness indicators, inactive Page lifecycle, unavailable-content behavior.                                                                                                                                                               |
| 9\. Hardening               | Security review, CI/testing completion, backup/restore rehearsal, Meta/business-identity documentation review, production verification, final README/runbook.                                                                                                    |

# 32. Implementation principles for Codex

- Build incrementally and keep the deployed environments working after each milestone.

- Do not invent Meta API behavior. Verify both technical capability and production eligibility first.

- Do not add scheduling/publishing, AI generation, billing, teams, or additional social networks unless explicitly requested later.

- Prefer simple, maintainable implementation over premature complexity.

- Keep Facebook API concerns isolated behind a service layer and pin the Graph API version explicitly.

- Keep ingestion idempotent: re-running a sync updates records rather than duplicates them.

- Use durable PostgreSQL-backed jobs, checkpoints, and leases for long-running ingestion.

- Make ingestion progress, data freshness, and meaningful failures visible in the UI.

- Use PostgreSQL for normal analytics, sorting, searching, and exports rather than interactive Meta API calls.

- Treat unavailable metrics as unknown, not zero.

- Use staging for risky infrastructure, migration, and Meta-integration changes before production.

- When an external setup action is required from the owner, stop coding that dependency and give clear click-by-click instructions before assuming it is complete.

- Update README.md and relevant docs as architecture or verified external behavior changes.

- Treat the business identity rule as non-negotiable: Bunyip Box is the product/brand; Hawker Works LLC is the owning and operating legal entity. Do not create contradictory legal or Meta-facing identity information.

# 33. First instruction to Codex

| **Start with Milestone 1 only:** Do not begin the Facebook integration yet. Establish the GitHub-to-DigitalOcean path, get a minimal production Next.js application live on DigitalOcean, then connect and verify the purchased Bunyip Box custom domain and HTTPS. Create an isolated staging deployment. Only after that foundation is stable should Codex proceed to PostgreSQL, Prisma, authentication, and the remaining milestones. |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

At the custom-domain step, Codex must ask the owner to confirm the exact purchased domain/hostname before changing DNS. Recommended application hostname is app.bunyipbox.com if the purchased domain is bunyipbox.com, leaving the root domain available for a future public marketing site.

After the custom domain is active, create the public Privacy Policy, Terms of Service, and Data Deletion Instructions routes and add the Hawker Works LLC ownership footer before beginning Meta integration. Verify these pages are accessible without authentication and that the product/legal relationship is visible and consistent.

The Meta integration begins only after the application foundation is working and the required Graph API capabilities have been manually proven. Do not build against assumed permissions or undocumented behavior.

**END OF MVP REQUIREMENTS**
