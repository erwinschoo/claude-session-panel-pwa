# claude session panel

Een klein "air-traffic-control" dashboard (installeerbare PWA) dat al je **lopende Claude Code
sessies** over meerdere VS Code windows toont — met live status (bezig / wacht op input /
wacht op permissie / klaar / offline), attention-routing en snelknoppen om de juiste VS Code
window te openen.

Geen cloud, geen account: een klein lokaal Node-servicetje leest `~/.claude` en serveert de PWA.

## hoe het werkt

```
~/.claude/{sessions,ide,projects}  ──►  companion (Node/Fastify, file-watch)  ──►  PWA (React)
                                          REST + WebSocket
```

- `sessions/<pid>.json` → welke sessies draaien (pid, sessionId, cwd, naam).
- `ide/<port>.lock` → welke VS Code windows er zijn (koppeling via cwd).
- `projects/<encoded>/<sessionId>.jsonl` → live transcript → status/titel/laatste bericht/tokens.

Status wordt afgeleid uit de laatste transcript-regel (`tool_use` = bezig, `end_turn` = jouw
beurt) plus of het CLI-proces nog leeft. Optioneel kun je Claude-hooks toevoegen voor directe
signalen (zie onder).

## installeren & starten

Vereist Node 18+ en de `code` CLI op je PATH (VS Code → command palette → "Shell Command:
Install 'code' command in PATH").

```bash
npm install                 # installeert server + web (workspaces)
cp server/.env.example server/.env
npm run build               # bouwt de PWA (web/dist)
npm start                   # start de companion op http://localhost:4317
```

Open http://localhost:4317. Start Claude Code in een paar VS Code windows en ze verschijnen
automatisch.

### development (hot reload)

```bash
npm run dev                 # Vite-devserver (5173) + companion (4317) parallel
```

De Vite-devserver proxyt `/api` en `/ws` naar de companion.

## configuratie (`server/.env`)

| Var | Betekenis |
|---|---|
| `PORT` | Poort van de companion (default 4317). |
| `HOST` | `127.0.0.1` = alleen deze machine (default). `0.0.0.0` voor LAN/Tailscale. |
| `AUTH_TOKEN` | Verplicht zodra `HOST` niet localhost is. Zet dezelfde waarde in de PWA via `localStorage.panel_token`. |
| `CODE_BIN` | Pad naar de VS Code CLI (default `code`). |

## mobiel / buiten je LAN

- **Paneel bekijken buiten huis** → zet `HOST=0.0.0.0` + een `AUTH_TOKEN`, en gebruik
  **Tailscale** (PC + telefoon) of een Cloudflare Tunnel. Open de PWA via het tailnet-adres en
  installeer 'm (Add to Home Screen). Zet in de browserconsole eenmalig
  `localStorage.panel_token = "<jouw token>"`.
- **Sessies écht bedienen vanaf mobiel** (prompt sturen, permissie goedkeuren) → gebruik Claude
  Code's eigen **remote-control**: `claude remote-control` (of `/config` → "Enable Remote Control
  for all sessions"). Werkt via claude.ai/code + de Claude-app, routeert via Anthropic (geen
  tunnel nodig). De `open in claude.ai/code`-knop in het paneel brengt je daarheen.

## optioneel: directe status via hooks (fase 2)

Voor directe "wacht op permissie/input"-signalen (i.p.v. file-polling) voeg je hooks toe aan
`~/.claude/settings.json`. Elke hook POST naar de companion:

```json
{
  "hooks": {
    "PermissionRequest": [{ "matcher": "", "hooks": [{ "type": "http", "url": "http://127.0.0.1:4317/hooks" }] }],
    "Notification":      [{ "matcher": "", "hooks": [{ "type": "http", "url": "http://127.0.0.1:4317/hooks" }] }],
    "Stop":              [{ "matcher": "", "hooks": [{ "type": "http", "url": "http://127.0.0.1:4317/hooks" }] }],
    "StopFailure":       [{ "matcher": "", "hooks": [{ "type": "http", "url": "http://127.0.0.1:4317/hooks" }] }]
  }
}
```

## design

De UI is ontworpen in Claude Design en 1-op-1 geport naar React. De runtime brand-tokens
(kleuren/typografie) staan in `web/public/_ds/`. De originele design-export zelf is niet in
deze repo opgenomen.

## beperkingen

- Er is geen deep-link naar een specifieke Claude-*tab*; `open VS Code` focust de juiste
  *window* (`code -r`).
- Kosten zijn een ruwe schatting op basis van model + tokens.
- `open VS Code` heeft alleen zin als je fysiek aan de machine zit.

*we commit. we deliver.*
