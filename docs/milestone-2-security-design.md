# Milestone 2 security design

This document is the implementation contract for Milestone 2 authentication,
workspace membership, List authorization, and link-based invitations. It must
be updated deliberately if the model changes. Application code and tests must
not weaken these rules.

## Security boundaries and invariants

- A user participates in a workspace only through an active workspace
  membership.
- Every workspace has exactly one Owner for the MVP. Normal application flows
  cannot remove or demote that Owner or leave the workspace ownerless.
- Every List belongs to one workspace. The Owner has implicit access to every
  List in that workspace; a Member has no List access without an explicit
  Viewer or Manager permission.
- Authorization is decided on the server from persisted relationships. Client
  navigation, submitted workspace IDs, submitted roles, and hidden controls
  are never trusted as authorization evidence.
- Every List-scoped lookup starts with the authenticated user and resolves the
  workspace membership, List, and effective permission in one authorization
  path. This applies equally to direct List IDs and indirect identifiers such
  as Page, Post, export, saved-item source, or job IDs.
- Shared Facebook Page and Post records grant no access by themselves. A user
  may reach shared source data only through a List they are currently allowed
  to access.
- Saved Posts, private notes, and preferences belong to one user. Sharing a
  workspace or List never makes that personal data visible to another user,
  including the Owner.
- Revoking a membership or List permission takes effect on the next
  server-authorized request. Existing sessions do not cache authorization
  grants.
- Production and staging use separate applications, databases, secrets,
  bootstrap state, sessions, invitations, and credentials.

## Roles and effective access

Workspace roles are stored as extensible values. Milestone 2 defines `OWNER`
and `MEMBER`. List permissions are stored separately as extensible values and
define `VIEWER` and `MANAGER`.

Effective List access is resolved in this order:

1. Reject an unauthenticated request.
2. Require an active membership in the List's workspace.
3. If the membership role is `OWNER`, grant Owner access implicitly.
4. Otherwise, require an explicit permission for that membership and List.
5. Grant the operation only if the effective role meets its minimum role.

Unknown or future role values deny access until explicitly included in the
central policy. A missing record is never interpreted as Viewer access.

## Permission matrix

`Yes` means the server policy may authorize the action after validating the
request and resource relationship. `No` means the server must deny it even if
the client exposes or submits the action.

| Capability | Owner | Manager | Viewer | Unassigned Member | Non-member |
| --- | --- | --- | --- | --- | --- |
| View workspace and own membership | Yes | Yes | Yes | Yes | No |
| Update workspace identity/settings | Yes | No | No | No | No |
| Create, rename, or delete a List | Yes | No | No | No | No |
| View a List and its permitted analytics | Yes | Yes | Yes | No | No |
| Search, sort, and filter permitted List data | Yes | Yes | Yes | No | No |
| Export permitted List data | Yes | Yes | Yes | No | No |
| Add or remove Pages in a List | Yes | Yes | No | No | No |
| Change permitted List configuration | Yes | Yes | No | No | No |
| Invite a workspace member | Yes | No | No | No | No |
| View, revoke, or replace pending invitations | Yes | No | No | No | No |
| Remove a workspace member | Yes | No | No | No | No |
| Grant, change, or revoke List permissions | Yes | No | No | No | No |
| Remove or demote the Owner | No | No | No | No | No |
| Read another user's saved state or private notes | No | No | No | No | No |
| Create/update/delete own saved state or note when source Post remains accessible | Yes | Yes | Yes | No | No |
| Access protected system status and administrative retries | Yes | No | No | No | No |

Manager and Viewer in this table mean a Member with that explicit permission
for the specific List involved. A user can be Manager for one List, Viewer for
another, and unassigned for all remaining Lists.

## Authorization response policy

- An unauthenticated request receives the application's standard
  unauthenticated response or login redirect, according to the route type.
- A request for a List or indirectly related resource that the authenticated
  user cannot access returns the same not-found response used for a missing
  resource. This avoids confirming cross-workspace identifiers.
- A user who can see the resource but lacks permission for the requested
  operation receives a forbidden response.
- Validation errors are returned only after the caller is authorized to act on
  the target, so validation details do not disclose inaccessible resources.
- Every mutation performs authorization and the write in the same request; a
  prior page view never serves as authorization for a later mutation.

## Invitation design

### Record and token

An invitation stores:

- workspace ID;
- normalized intended email;
- optional intended display name;
- creator membership/user ID;
- token hash and a token-version identifier;
- creation and expiration timestamps;
- nullable revoked and redeemed timestamps;
- nullable redeeming user ID; and
- optional initial List permission assignments that remain inactive until
  redemption succeeds.

The server generates at least 32 random bytes (256 bits) with a cryptographic
random-number generator. The URL-safe plaintext token is shown only in the URL
returned when the invitation is created. The database stores only a
domain-separated cryptographic hash of the token, never the plaintext. Tokens
are not included in logs, analytics, error reports, or administrative lists.

The initial expiration is seven days and is configuration-backed. Creating a
replacement invitation revokes the previous invitation in the same owner
action where practical; it never reuses token material.

### Creation and delivery

Only the Owner may create an invitation. The server normalizes the intended
email using the same canonicalization used for user uniqueness, validates any
initial List assignments belong to the Owner's workspace, creates the hashed
record, and returns the plaintext URL once.

There is no outbound email in the MVP. The UI tells the Owner to transmit the
link securely and warns that possession of the link allows a redemption
attempt. Link possession alone never grants workspace or List access.

### Redemption

Redemption requires an authenticated account or account creation. Before any
membership or permission becomes active, the server:

1. Parses and bounds the supplied token before hashing it.
2. Looks up the token hash without logging the plaintext.
3. Verifies the invitation exists, is unexpired, unused, and unrevoked.
4. Verifies the authenticated account's normalized email exactly matches the
   intended normalized email.
5. In one database transaction, creates or associates the workspace
   membership, applies valid initial List permissions, and conditionally marks
   the invitation redeemed by that user only if it is still redeemable.
6. Treats a failed conditional update or uniqueness conflict as an already
   consumed redemption and grants nothing outside that transaction.

Concurrent attempts therefore have one possible winner. Repeated, expired,
revoked, malformed, wrong-email, and cross-workspace attempts fail without
creating a partial membership or permission.

The redemption response sends a restrictive `Referrer-Policy: no-referrer`,
loads no third-party resources, is excluded from analytics, and never places
the token in client persistence. Successful redemption redirects to a clean
URL so the token does not remain in browser history during normal navigation.

### Revocation and retention

Only the Owner of the invitation's workspace may revoke it. Revocation is a
conditional update that succeeds only while the invitation is unused and not
already revoked. Revoking an invitation does not remove a membership created
by an earlier completed redemption; membership removal is a separate explicit
Owner action.

Expired, revoked, and redeemed invitation records are retained long enough for
security auditing but never expose their token hashes in normal application
responses.

## Invitation threat model

| Threat | Required mitigation | Verification |
| --- | --- | --- |
| Database disclosure reveals usable links | Store only a domain-separated hash of at least 256 bits of random token material | Persistence test proves plaintext is absent and a hash cannot be submitted as the token |
| Token guessed by brute force | High-entropy tokens, bounded parsing, rate limits, and generic failures | Entropy/unit test and rate-limit integration test |
| Link intercepted or forwarded | HTTPS only, short expiry, intended-email match, secure-sharing warning | Wrong-email and expired-token integration tests |
| Token leaks through logs or telemetry | Redaction, no request-body/query logging, no analytics or third-party resources on redemption | Log-capture tests and page/header inspection |
| Token leaks in referrers/history | `no-referrer`, no third-party resources, and redirect to a token-free URL after success | End-to-end response/header and redirect test |
| Replay after successful redemption | Single-use state changed conditionally in the redemption transaction | Sequential replay integration test |
| Concurrent double redemption | Conditional update plus membership/permission writes in one transaction | Concurrent redemption integration test proves one winner |
| Owner revokes during redemption | Transactional/conditional state transition; losing operation grants nothing | Revocation/redemption race integration test |
| Wrong user claims an invitation | Authenticated normalized email must match the intended email | Wrong-email tests for existing and newly created accounts |
| Invitation crosses workspace boundaries | Workspace derived from the invitation; initial List IDs validated against it | Cross-workspace List assignment and tampered-ID tests |
| Invitation possession grants pre-redemption access | No membership or permission exists until atomic redemption completes | Authorization test using an unredeemed valid token |
| Privilege escalation through submitted roles | Server allow-list permits only supported initial List roles; Owner role is never invitation-controlled | Invalid-role and Owner-escalation tests |
| User enumeration through failures | Generic external failure responses with detailed sanitized server-side reason codes | Response-equivalence tests across invalid states |

## Session and credential requirements

- Passwords use an established password-hashing library and current safe
  parameters. Passwords and resettable equivalents are never logged.
- Session identifiers contain cryptographic entropy and are stored so a
  database disclosure does not expose immediately reusable browser cookies.
- Production cookies are `HttpOnly`, `Secure`, use an appropriate `SameSite`
  policy, and are scoped as narrowly as the application permits.
- Login is rate-limited by multiple signals without trusting a client-supplied
  forwarding header. Errors do not disclose whether an email exists.
- Logout invalidates the server-side session. Permission changes and membership
  revocation require no session refresh to take effect.
- Owner bootstrap is available only when no workspace exists. User, workspace,
  Owner membership, and bootstrap consumption are committed atomically, and
  concurrent bootstrap attempts can create only one Owner/workspace.
- There is no public signup after bootstrap. Account creation is allowed only
  as part of valid invitation redemption.
- MVP password recovery is an audited administrative procedure; it does not
  invent email delivery infrastructure.

## Required security tests before Milestone 2 is complete

- Atomic Owner/workspace bootstrap and concurrent bootstrap attempts.
- Disabled public signup after bootstrap.
- Login, persistent session, logout invalidation, secure production cookie
  configuration, and brute-force controls.
- Full permission-matrix coverage for server-rendered routes, server actions,
  APIs, queries, mutations, exports, and indirect resource identifiers.
- Cross-workspace and guessed-ID tests for Lists, Pages, Posts, jobs, exports,
  invitations, and membership records.
- Immediate access loss after membership or List-permission revocation.
- Owner lockout prevention and preservation of exactly one MVP Owner.
- Invitation entropy, hash-only storage, expiry, revocation, email matching,
  one-time redemption, concurrent redemption, race handling, redaction, and
  rate limiting.
- Private saved-state and note isolation between users who share a List.
- Separate staging and production database/secret configuration checks.

