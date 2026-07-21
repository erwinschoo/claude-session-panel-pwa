# claude session panel

Een "air-traffic-control" dashboard dat al je **lopende Claude Code sessies** over meerdere
VS Code windows toont — live status (bezig / wacht op input / wacht op permissie / klaar /
offline), attention-routing, en snelknoppen om de juiste VS Code window te openen. Vanaf je
laptop én je telefoon.

Geen cloud-account: één klein **host**-programma leest `~/.claude`, serveert de app én toont
'm. Je telefoon of andere PC opent gewoon de host-URL — same-origin, dus zonder gedoe.

## hoe het werkt

```
~/.claude/{sessions,ide,projects}
        │  (file-watch)
        ▼
   host  (session-panel-host.exe)
   • leest live sessies + status
   • serveert de app + /api + /ws
   • opent zelf het dashboard (app-venster)
        │
        ├── laptop:   localhost         (auto-open)
        ├── telefoon: scan QR → LAN-URL of Tailscale
        └── andere PC: open de LAN-URL
```

Status volgt uit de laatste transcript-regel (`tool_use` = bezig, `end_turn` = jouw beurt) plus
of het CLI-proces nog leeft. Optionele Claude-hooks geven directere signalen (zie onder).

## gebruiken (de host-app)

Download **`session-panel-host.exe`** van de
[laatste Release](https://github.com/erwinschoo/claude-session-panel-pwa/releases/latest) en
dubbelklik. De host:

1. start en leest je lopende sessies,
2. opent het **dashboard als app-venster** (op je laptop, via `localhost`),
3. toont in de console de **URL's + QR-code(s) + token** voor andere apparaten.

Op je laptop hoef je verder niets — geen Tailscale, geen adres invoeren.

> Vereist dat de `code` CLI op PATH staat (VS Code → *Shell Command: Install 'code' command in
> PATH*) voor de "open VS Code"-knop.

## op je telefoon of andere PC

**Zelfde WiFi:** scan de QR uit de host-console → je telefoon opent de LAN-URL → het dashboard
verschijnt (same-origin, automatisch verbonden). *Toevoegen aan startscherm* geeft een icoon.

**Buiten WiFi (mobiele data / ander netwerk):** dat gaat via **Tailscale** (gratis, privé):

1. Installeer Tailscale op je laptop én telefoon (zelfde account).
2. Zet HTTPS-certificaten aan in de Tailscale-admin (MagicDNS + HTTPS).
3. De host detecteert Tailscale en zet **automatisch `tailscale serve`** op → er verschijnt een
   tweede QR voor `https://<machine>.<tailnet>.ts.net`. Scan die → dashboard via `wss`,
   installeerbaar als PWA. Alles privé tussen jóuw apparaten.

> Lukt de automatische serve niet (rechten/versie), draai eenmalig `tailscale serve 4317` — de
> console toont deze hint.

## zelf draaien vanaf de broncode

Vereist Node 18+.

```bash
npm install
npm run build     # bouwt de app
npm start         # host op http://localhost:4317 (print URL/QR/token)
npm run build:exe # bouwt de losstaande .exe (Windows) → dist-exe/
```

Development met hot reload: `npm run dev` (Vite :5173 + host :4317).

## prompten & permissies vanaf je telefoon → Claude remote-control

Dit paneel is de **overzicht/status/notificatie**-laag. Voor het daadwerkelijk *prompten* en
*goedkeuren van permissie-gates* op afstand gebruik je Claude's eigen **remote-control**:

- Aanzetten: `claude remote-control`, of `/config` → "Enable Remote Control for all sessions".
- Bedienen via **claude.ai/code** of de **Claude mobiele app** — routeert via Anthropic, geen
  tunnel nodig. De **"open in claude.ai/code"**-knop per sessie brengt je erheen.

## configuratie (`server/.env`)

| Var | Betekenis |
|---|---|
| `PORT` | Poort van de host (default 4317). |
| `HOST` | `127.0.0.1` = alleen dit device. `0.0.0.0` voor LAN/Tailscale (default in de .exe). |
| `AUTH_TOKEN` | Vast token; leeg = auto-gegenereerd zodra niet-localhost. |
| `OPEN_APP` | `1`/`0` = dashboard-venster wel/niet automatisch openen (default aan in de .exe). |
| `NO_TAILSCALE` | `1` = zet niet automatisch `tailscale serve` op. |
| `CODE_BIN` | Pad naar de VS Code CLI (default `code`). |
| `ALLOWED_ORIGINS` | Extra toegestane origins (voor de optionele github.io-route). |

## optioneel: directe status via hooks

Voor directe "wacht op permissie/input"-signalen voeg je hooks toe aan `~/.claude/settings.json`
die naar de host POSTen (`http://127.0.0.1:4317/hooks`): `PermissionRequest`, `Notification`,
`Stop`, `StopFailure`. De host gebruikt hooks als snel signaal bovenop het file-watchen.

## optioneel: install-link via GitHub Pages

De app staat ook op **https://erwinschoo.github.io/claude-session-panel-pwa/** als vaste
install-URL. Dit is een *fallback* — je moet er handmatig de host-URL + token invoeren, en een
`https`-pagina kan alleen een `https`-host (Tailscale) bereiken, geen `http`-LAN (mixed content).
De eenvoudigste weg blijft: open de host-URL rechtstreeks (via de QR).

## beperkingen

- Geen deep-link naar een specifieke Claude-*tab*; `open VS Code` focust de juiste *window*.
- Kosten zijn een ruwe schatting.
- `open VS Code` heeft alleen zin als je fysiek aan de host-machine zit.

## design

Ontworpen in Claude Design en 1-op-1 geport naar React; brand-tokens in `web/public/_ds/`.

*we commit. we deliver.*
