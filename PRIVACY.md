# Privacy Policy — AI Chat Exporter

**Last updated: October 2026**

## Overview

AI Chat Exporter is a browser extension that helps you export your AI chat conversations
to PDF and Markdown files. All processing happens locally in your browser.

## Data Collection

**Conversation exports stay local and are not sent to extension-operated servers.**
Separately, the optional feedback website stores only feedback you explicitly submit,
as described below. We do not sell your data.

The extension accesses the following data solely to perform exports:

- **Conversation content**: The text, code blocks, and metadata of conversations you choose to export from ChatGPT, Gemini, Claude, DeepSeek, and Grok.
- **Authentication tokens**: Session tokens from AI platforms (stored locally) to access conversation APIs for user-initiated exports. These tokens are used only with the platform you are already signed in to and are never sent to extension-operated servers.
- **User preferences**: Your export settings (filename format, download folder, format preferences) stored in your browser's local storage.

## Data Storage

Extension export data and preferences are stored locally using the `chrome.storage` API:

- `chrome.storage.local`: Export settings, recent export records, scheduled-export status, the most recent manual export queue (conversation IDs/titles/URLs, a settings snapshot, progress, and browser resource IDs), temporary conversation snapshots, and optional recovery drafts. The manual queue is replaced by the next queue; its transcript bodies are not stored in the queue record. Existing temporary export snapshots and new page-preview snapshots expire after one hour; cleanup may occur later if the browser is closed or storage operations fail. The new page-preview cache allows at most 1 MiB per entry, 2 MiB overall, and 20 entries. Older automatic DOM fallback caching still exists independently; turning off optional recovery does not mean the extension stores no conversation content.
- Gemini credentials use `chrome.storage.session` when the content script can access it. This area is memory-backed and cleared when the browser session ends. If it is unavailable or inaccessible, Gemini falls back to `chrome.storage.local`, which is stored on disk. Credentials are never synced across devices.

## Page snapshots and optional local recovery

A manual Gemini page snapshot reads only conversation content loaded and readable in the page DOM at capture time. It does not establish that the provider's complete history was captured. Copy, Markdown, and PDF exports use the fixed capture and current privacy options; an existing preview cannot silently change its options. Recapture before reopening a preview with different options. A temporary preview is stored locally for at most one hour, subject to the cache limits above. A safe-share copy applies heuristic redaction, **not** a guarantee that all sensitive information is removed; review it before sharing.

Local recovery is **off by default**. When you enable it for a conversation, the extension stores an initial checkpoint and later observed page-content changes locally. By default drafts are limited to 1 MiB each, 4 MiB total, and 20 drafts, retained for seven days after their last save. The recovery page lets you choose 7, 30, or 90 days, or keep drafts until you delete them. Expanded local storage is a separate explicit opt-in: with the browser's `unlimitedStorage` permission it removes the application byte limits, not the 20-draft limit or physical disk/browser constraints. Chrome and Edge request this optional permission when you enable expanded storage; Firefox declares it at installation because Firefox does not support requesting it optionally, but the application still uses default limits until you opt in. Returning to default limits or losing permission does not delete existing drafts. Storage pressure pauses new saves rather than evicting unexpired drafts. Saving can fail at storage limits; the previous successful checkpoint is retained, not an unlimited revision history. Protection does not restart automatically after a browser restart (a worker wake is not a browser restart). Stopping protection retains the draft until deletion or expiry; deleting a draft, or clearing all drafts, also stops protection for affected drafts and rejects late writes. These drafts remain in browser-managed local storage, not synced or uploaded to extension-operated servers. Delete them on the recovery page or uninstall the extension. Downloaded copies must be deleted separately.

## Remote Content During Preview and PDF Export

Preview and PDF export may load images from URLs included in a conversation.
These requests go to the image host, which may be the AI platform, its CDN, or
another website referenced in the conversation. No image content passes through
extension-operated servers. Disable "Include images" to prevent the extension
from rendering these remote images. Markdown files can retain remote image URLs;
opening them in another application may cause that application to fetch the images.

## Data Transmission

The extension accesses the following AI platforms using your existing signed-in session for exports and schedules you enable. Remote image rendering is described above:

- `chatgpt.com` / `chat.openai.com`
- `gemini.google.com`
- `claude.ai`
- `deepseek.com` / `chat.deepseek.com`
- `grok.com` / `www.grok.com`

No export data is sent to extension-operated servers. No analytics, telemetry, or tracking.

## Third-Party Services

The extension does not integrate with third-party analytics or advertising.
After uninstalling, your browser may open our optional feedback page hosted on
GitHub Pages. Visiting it makes an ordinary web request to GitHub; no chat data,
account identifier, or extension settings are included in the URL. The page uses
no analytics or local storage and sends no feedback automatically. Clicking
**Submit feedback** sends your selected reasons, optional text (up to 600 characters),
page language, and a random submission ID to `feedback.pengyuhao.com`, hosted on
Cloudflare Workers with D1 storage. No email or GitHub account is required. Feedback
is visible only through the password-protected maintainer dashboard, not published
as an issue. Do not include private conversations or credentials.

Feedback is retained for up to 180 days, with daily cleanup. To prevent abuse, the
service transiently processes the request IP address and stores only a salted,
time-bucketed HMAC for rate limiting; these counters expire and are cleaned up after
48 hours. The application does not store raw IP addresses, browser fingerprints,
chat content, or extension settings, and application request logging is disabled.
Cloudflare still processes network requests under its own policies. The admin panel
uses a secure session cookie; the public feedback submission sends no credentials.
If you need removal of identifiable feedback, contact the support address below
with sufficient details to locate it. Anonymous submissions cannot always be linked
to a person. The independent GitHub help link leads to public support, subject to
GitHub's privacy policy; it does not prefill your private feedback.

## Data Deletion

Uninstall the extension to remove its browser-managed settings, cached snapshots,
credentials, and export records. Changing settings or clearing export history does
not delete all extension data. Files you have already downloaded remain on your
computer; delete those files separately if you no longer want them.

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Store export preferences, temporary previews, export progress, and optional local recovery drafts |
| `unlimitedStorage` | Expanded local recovery storage: optional on Chrome/Edge, declared at installation on Firefox; application opt-in is required on every browser |
| `activeTab` | Access the current tab when you click export |
| `downloads` | Save exported files to your computer |
| `alarms` | Check enabled export schedules and clean up temporary snapshots |

## Contact

For privacy questions, email extensions@pengyuhao.com. For public bug reports,
you can also use https://github.com/pinguarmy/ai-chat-exporter/issues.
Do not post private conversations or credentials in public issues.

## Changes

We will update this policy if our practices change. Check the "Last updated" date above.

## Optional archive and share copies

Archive bundles are generated locally. Tool arguments/results are included only
when the user enables tool trace; they can contain private material. Only
provider-exposed ChatGPT events are currently collected. Hidden provider messages
and raw provider payloads are not added by this feature. Archive manifests state
that external attachments are not embedded and that hashes do not authenticate
the provider. Share copies redact common credential patterns, report how many
replacements were made, and require review for other private information.
