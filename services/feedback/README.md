# Optional feedback service

Small Cloudflare Worker + D1 receiver. This directory is independent of the extension build and has no npm dependencies. It contains no deployment account identifiers or secret values.

## Configure privately

Copy `wrangler.example.jsonc` to a private deployment location, then supply your own D1 binding configuration and database ID there. Bind the database as `DB`. Apply `schema.sql` to that database before serving traffic, for example with Wrangler's `d1 execute <database-name> --remote --file <path-to-schema.sql>` command. Run it once per target environment. Set secrets using `wrangler secret put FEEDBACK_SECRET` and `wrangler secret put ADMIN_PASSWORD` against that private configuration. Do not commit the actual configuration or credentials.

- `FEEDBACK_SECRET`: cryptographically random HMAC key, at least 32 characters. Rotating it invalidates admin cookies and changes rate-limit hashes.
- `ADMIN_PASSWORD`: strong random password, at least 12 characters. Keep it private; use HTTPS only. Rotating only the password does not invalidate existing signed cookies; rotate `FEEDBACK_SECRET` too when revoking sessions.
- Schedule: example cron runs daily. Feedback retention is 180 days. Anonymous counters expire after 48 hours and are removed by the scheduled cleanup.

Provisioning and runtime configuration are maintainer operations outside this public directory. For an existing pre-contact database, apply `migrations/0002-contact.sql` **once before deploying** the contact-aware Worker, using `wrangler d1 execute <database-name> --remote --file <path-to-0002-contact.sql>` against the private configuration. It adds a non-null `contact` column with an empty-string default without deleting or rewriting existing feedback. Fresh databases should use the updated `schema.sql` only; do not apply the ALTER migration afterward. The contact migration is not automatically idempotent: record its application and do not rerun it.

## Frontend API

`POST /api/feedback` accepts only JSON (up to 8 KiB) from the exact Origin `https://pinguarmy.github.io` or the Worker's own origin. Allowed preflights permit POST and Content-Type only. Request:

```json
{
  "id": "a fresh UUID retained for retries",
  "reasons": ["Hard to use"],
  "text": "Optional feedback, up to 600 characters",
  "contact": "Optional email address or handle, up to 200 characters",
  "locale": "en",
  "honeypot": ""
}
```

The placeholder above is explanatory; generate a real UUID with `crypto.randomUUID()`. Reasons are limited to the six strings exported as `REASONS` in `worker.mjs`. `locale` is `en` or `zh-CN`. At least one reason or non-whitespace text is required; contact alone is not feedback. `contact` may be omitted (defaults to `""`) or supplied as a string of at most 200 Unicode code points, allowing an email address or other handle without imposing email-only syntax. Leading/trailing whitespace is trimmed; C0/C1 control characters (including newlines and tabs) are rejected with `invalid_contact`. Explicit `null` and other non-string values are rejected. Existing clients that omit it remain compatible. Keep the UUID across a retry, and generate a new one for a distinct submission.

- Successful saved submission: HTTP 201, `{ "ok": true, "id": "…" }`. Retrying a saved UUID has the same result and does not duplicate the row.
- Honeypot filled: HTTP 200 success-shaped response, but nothing is saved. Do not treat this as persistence confirmation.
- Errors: JSON `{ "ok": false, "error": "…" }`, HTTP 400/403/413/415/429/503 as appropriate.
- Limits: 10 submissions per hour per IP, 300 submissions per UTC day globally. Counters use atomic SQLite upsert/RETURNING, not a read/increment race. Raw IP addresses are never stored; per-bucket HMAC identifiers expire after 48 hours.

No browser identifier, chat data, or referrer is collected by the service. A user may voluntarily supply a contact email or handle; it is stored privately with the feedback and has the same 180-day retention. Feedback and contact text can contain personal information; disclose this optional collection and ask users not to submit sensitive data. Public submission responses return only the submission ID, never contact information; contact is available only through the authenticated admin list. All API responses are `Cache-Control: no-store`.

## Owner interface

Open `/admin` on the Worker's own HTTPS origin. Without a signed session it displays the password screen; with a valid session it displays the latest 100 submissions. Feedback content is never included in the initial HTML and is fetched only after authentication. The interface displays optional contact separately with a **Contact / 联系方式** label, uses `textContent` for all user data, and never auto-links an untrusted email/handle/URL. It has a nonce CSP and local serif fonts; there are no remote assets.

- `POST /api/login`: JSON `{ "password": "…" }`; exact same Origin required. Ten attempts per 15-minute bucket/IP; password comparison uses fixed-size HMAC digests and a constant loop.
- Session: signed HMAC cookie, host-only, HttpOnly, Secure, SameSite=Strict, eight-hour expiry.
- `GET /api/admin/feedback`: protected latest 100 rows, newest first. No external CORS. An explicit foreign Origin is rejected.
- `PATCH /api/admin/feedback/:id`: same-origin authenticated JSON `{ "status": "new" | "read" | "resolved" }`.
- `POST /api/logout`: same-origin; expires the browser cookie. Stolen cookies cannot be individually revoked and remain valid until expiry or HMAC-secret rotation.

## Local tests

```sh
node --test services/feedback/backend.test.mjs
```

Requires a Node runtime with the built-in `node:sqlite` module (tested on Node 24). Tests execute the actual migration and parameterized SQL against in-memory SQLite through a small D1 API adapter. They cover input/size/CORS restrictions, idempotency, injection-safe persistence, honeypot and failure responses, submission/login limits, session protection, admin status changes, and retention. This is local backend execution, not a real Cloudflare/D1 or live browser deployment test.
