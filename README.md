# Clarify

> Right-click any text, image, or video on any webpage and get instant AI answers — using your **existing** ChatGPT, Claude, or Gemini subscriptions. No API keys required.

![CI](https://github.com/kukkadapudheeraj/Clarify/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8-orange)
![Chrome](https://img.shields.io/badge/Chrome-MV3-yellow)

---

## How It Works

```
  You                  Clarify Extension                               AI Provider
   │                         │                                               │
   │  Right-click text /     │                                               │
   │  image / video ────────►│                                               │
   │                         │  Chat widget opens at bottom-right            │
   │◄────────────────────────│                                               │
   │                         │                                               │
   │  Type follow-up ───────►│                                               │
   │                         │  fetch() directly from service worker ───────►│
   │                         │  Authorization: Bearer {encrypted token}      │
   │                         │◄──────────────────────────────────────────────│
   │◄────────────────────────│  AI response in widget                        │
```

> **Fully serverless.** The extension calls AI provider APIs directly from the background service worker — no intermediate server required, no hosting costs, no deployment.

---

## Features

| Feature | Description |
|---|---|
| **Text context** | Highlight any text → right-click → AI explains, simplifies, summarizes, or translates it |
| **Image context** | Right-click any image → AI describes and analyzes it |
| **Video context** | Right-click any video or link → AI helps you understand the content |
| **Mini chatbot** | Persistent bottom-right widget — keep the conversation going like a real chatbot |
| **Multi-provider** | Switch between Gemini, ChatGPT, and Claude from the popup |
| **No API keys** | Links to your existing browser sessions — no billing setup needed |
| **Free models by default** | Uses the free tier of each provider — upgrade to paid models in Settings |
| **Encrypted token storage** | Session tokens encrypted with AES-256-GCM, stored only on your device |
| **Copy responses** | One-click copy button on every AI response |
| **Custom system prompt** | Override the default AI instructions from the Settings page |
| **No server needed** | Calls AI APIs directly from the service worker — nothing to host or deploy |
| **First-run onboarding** | Welcome guide in the popup walks new users through setup |

---

## Demo

```
┌─────────────────────────┐
│ Clarify      [−] [×]  │  ← header
├─────────────────────────┤
│ 📄 Selected Text        │
│ "Quantum entanglement    │  ← ContextPreview
│  is a phenomenon..."    │
├─────────────────────────┤
│ [Explain] [Simplify]    │  ← action pills (text mode)
│ [Summarize] [Translate] │
├─────────────────────────┤
│ 🤖 Quantum entanglement │
│    is when two particles │  ← AI response
│    become linked...     │
│                         │
│ 👤 Can you give an      │  ← user follow-up
│    analogy?             │
│                         │
│ 🤖 Think of it like two │  ← AI follow-up
│    magic dice...        │
├─────────────────────────┤
│ [Type a follow-up... →] │  ← input
└─────────────────────────┘
          ↑
  Pinned bottom-right,
  always on top of the page
```

---

## Project Structure

```
Clarify/
├── packages/
│   ├── shared/          # Shared TypeScript types & utilities
│   │   └── src/
│   │       ├── types/   # Provider, ChatMessage, ContextType, etc.
│   │       └── utils/   # sanitize, prompt builders
│   │
│   ├── extension/       # Chrome Extension (MV3, React + TypeScript)
│   │   └── src/
│   │       ├── background/    # Service worker — context menus + routing
│   │       ├── content/       # Chat widget injected into every page
│   │       ├── popup/         # Toolbar popup — switch providers
│   │       ├── options/       # Full settings page
│   │       ├── providers/     # Auth modules (Gemini OAuth, OpenAI/Claude cookies)
│   │       └── storage/       # Typed chrome.storage helpers
│   │
│   └── server/          # Backend API (Node.js + Express + TypeScript)
│       └── src/
│           ├── routes/        # POST /api/chat, auth endpoints
│           ├── controllers/   # Request handlers
│           ├── services/      # AI provider classes (Gemini, OpenAI, Claude)
│           ├── middleware/     # Auth, error handling, request logging
│           ├── config/        # Environment variables
│           └── logger/        # Pino structured logger
│
├── .github/workflows/
│   ├── ci.yml           # Lint + test + build on every push / PR
│   └── release.yml      # Build + zip extension on version tag
│
├── .eslintrc.js
├── .prettierrc
└── pnpm-workspace.yaml
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Extension build | Vite + @crxjs/vite-plugin |
| Extension UI | React 18 + TypeScript |
| Widget isolation | Shadow DOM (no CSS conflicts) |
| Backend | Node.js + Express + TypeScript |
| Build (server) | tsup |
| Logging | Pino (server-side only, never in browser) |
| Testing | Vitest + supertest |
| Linting | ESLint + @typescript-eslint |
| Formatting | Prettier |
| CI/CD | GitHub Actions |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 8 — install with `npm install -g pnpm`
- **Chrome** ≥ 114

### 1. Clone and install

```bash
git clone https://github.com/your-username/Clarify.git
cd Clarify
pnpm install
```

### 2. Configure Gemini OAuth (required for Gemini provider)

Open `packages/extension/src/manifest.json` and replace the placeholder:

```json
"oauth2": {
  "client_id": "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com"
}
```

> **How to get a client ID:**
> 1. Go to [Google Cloud Console](https://console.cloud.google.com/)
> 2. Create a project → Enable the **Generative Language API**
> 3. Go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
> 4. Application type: **Chrome Extension**
> 5. Paste the generated client ID above

### 3. Build and load the extension

```bash
pnpm --filter @clarify/extension build
```

Then load it in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select `packages/extension/dist/`
5. Note the **Extension ID** shown under the extension name — you'll need it for the Gemini OAuth client and for tightening `CORS_ORIGIN` in production

---

## Using the Extension

### Connect an AI provider

Click the **Clarify** icon in your Chrome toolbar to open the popup:

```
┌──────────────────────────┐
│  Clarify               │
│  Active: [ Gemini    ▼ ] │
│                          │
│  ● Gemini   [Connected ✓]│
│  ○ ChatGPT  [Connect  →] │
│  ○ Claude   [Connect  →] │
└──────────────────────────┘
```

- **Gemini** — click Connect and complete the Google OAuth flow
- **ChatGPT** — click Connect and log in to chat.openai.com in the tab that opens
- **Claude** — click Connect and log in to claude.ai in the tab that opens

### Ask about text

1. **Select any text** on a webpage
2. **Right-click** the selection
3. Choose **"Ask Clarify"**
4. The chat widget opens at the bottom-right with the text pre-loaded

Use the action pills to change the mode:

| Pill | What it does |
|---|---|
| Explain | Clear explanation of the selected text |
| Simplify | Rewritten for a general audience |
| Summarize | 3 bullet-point summary |
| Translate | Converted to plain English |

### Ask about an image

1. **Right-click any image** on the page
2. Choose **"Ask Clarify about this image"**
3. The widget opens with a thumbnail preview — AI describes and analyzes it

### Ask about a video

1. **Right-click a video** or any link
2. Choose **"Ask Clarify about this video"**
3. The widget opens with the URL — AI helps you understand the content

### Continue the conversation

Type in the input box at the bottom of the widget and press **Enter** (or **Shift+Enter** for a new line). The full conversation history is sent with every request — the AI remembers the context.

```
[minimize −]  collapses widget to a small tab at the bottom-right
[close ×]     clears the conversation and hides the widget
```

---

## Development

### Run all tests

```bash
pnpm test
# or individually:
pnpm --filter @clarify/server test
```

To see detailed request/response logs during tests:

```bash
VERBOSE=true pnpm --filter @clarify/server test
```

### Lint and format

```bash
pnpm lint           # ESLint (zero warnings enforced)
pnpm format         # Prettier write
pnpm format:check   # Prettier check (used in CI)
```

### Build everything

```bash
pnpm build
# Builds server → packages/server/dist/
# Builds extension → packages/extension/dist/
```

### Watch mode (extension)

```bash
pnpm --filter @clarify/extension dev
# Rebuilds on every file save — just reload the extension in chrome://extensions
```

---

## API Reference

### `POST /api/chat`

Send a multi-turn conversation to an AI provider.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "provider": "gemini",
  "token": "<provider-auth-token>",
  "messages": [
    { "role": "system",    "content": "You are a helpful assistant..." },
    { "role": "user",      "content": "Explain quantum entanglement" },
    { "role": "assistant", "content": "Quantum entanglement is..." },
    { "role": "user",      "content": "Can you give an analogy?" }
  ]
}
```

**Optional body fields:**

```json
{
  "model": "gpt-4o"
}
```

Omit `model` to use the provider's free-tier default (`gpt-4o-mini`, `gemini-1.5-flash`, `claude-3-5-haiku-20251001`). Pass a model string to override (e.g. `gpt-4o` for Plus subscribers).

**Response `200`:**
```json
{ "answer": "Think of it like two magic dice...", "modelUsed": "gpt-4o-mini" }
```

**Rate limit:** 20 requests per minute per IP. Exceeding returns `429`:
```json
{ "error": "Too many requests. Please wait a moment and try again." }
```

**Error responses:**

| Status | Reason |
|---|---|
| `400` | Missing or invalid `provider`, empty `messages` |
| `401` | Missing `token` |
| `429` | Rate limit exceeded |
| `500` | AI provider API error |

### `GET /health`

```json
{ "status": "ok", "version": "1.0.0" }
```

---

## Security

| Concern | How it's handled |
|---|---|
| **Token storage** | Session tokens are encrypted with **AES-256-GCM** before storage. The encryption key is generated once per device and stored as a JWK in `chrome.storage.local`. Tokens never touch `chrome.storage.sync` and never leave your device. |
| **Sync storage** | Only non-sensitive settings (active provider, selected model) are written to `chrome.storage.sync`. No tokens, no personal data. |
| **Widget isolation** | The chat widget runs inside a **Shadow DOM** — its styles and scripts are fully isolated from the host page. |
| **No source maps** | Production builds strip all source maps and `console.*` calls so the original code isn't readable from DevTools. |
| **Direct API calls** | AI requests go from the service worker straight to the provider (OpenAI / Anthropic / Google). No third-party server ever sees your token or messages. |

---

## Deployment

Clarify is **fully serverless** — the extension calls AI provider APIs directly. There is nothing to host.

### Build for production

1. Update `packages/extension/src/manifest.json` with your real Gemini OAuth client ID
2. Build:
   ```bash
   pnpm --filter @clarify/extension build
   ```
3. Zip the output:
   ```bash
   # macOS / Linux
   cd packages/extension/dist && zip -r ../clarify-v1.0.0.zip .
   # Windows (PowerShell)
   Compress-Archive -Path packages/extension/dist/* -DestinationPath clarify-v1.0.0.zip
   ```
4. Submit the ZIP at [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole) (one-time $5 developer fee)

---

## Release

Tag a version to trigger an automatic GitHub release with the packaged extension ZIP:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `release.yml` workflow will:
1. Build the extension
2. Create `Clarify-v1.0.0.zip` from `packages/extension/dist/`
3. Publish a GitHub Release with the ZIP attached

---

## Architecture Decisions

**Why call AI APIs directly from the extension instead of a backend server?**
The extension already stores session tokens securely (AES-256-GCM encrypted in `chrome.storage.local`). Chrome MV3 service workers can `fetch()` any URL listed in `host_permissions` without CORS restrictions, so a proxy server adds complexity with no security benefit. Calling providers directly also means no hosting costs and no server to maintain.

**Why Shadow DOM for the chat widget?**
Injecting a React component directly into a webpage risks CSS collisions. Shadow DOM creates a fully isolated style boundary — the widget looks identical on every site.

**Why pnpm workspaces?**
Shared types (`ChatMessage`, `ContextType`, `Provider`) live in `@clarify/shared` and are consumed by both the extension and the server with zero duplication. pnpm symlinks make this seamless without publishing to npm.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and ensure all checks pass:
   ```bash
   pnpm lint && pnpm test && pnpm build
   ```
4. Open a pull request — CI will run automatically

---

## License

MIT
