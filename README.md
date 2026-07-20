# claude session panel

Een "air-traffic-control" dashboard (installeerbare **PWA**) dat al je **lopende Claude Code
sessies** over meerdere VS Code windows toont — live status (bezig / wacht op input / wacht op
permissie / klaar / offline), attention-routing, en snelknoppen om de juiste VS Code window te
openen. Vanaf je desktop én je telefoon.

Geen cloud-account: een klein lokaal **host**-programma leest `~/.claude` en serveert de data.
De PWA praat met die host via een instelbare URL — lokaal, over je LAN, of (buiten huis) via
Tailscale.

## architectuur

```
~/.claude/{sessions,ide,projects}
        │  (file-watch)
        ▼
   host  (Node/Fastify)  ── REST + WebSocket ──►  PWA (React)
   • leest live sessies + status                 • desktop / Android / andere PC
   • serveert de PWA + /api + /ws                • of vanaf github.io
```

- `sessions/<pid>.json` → welke sessies draaien.
- `ide/<port>.lock` → welke VS Code windows er zijn (koppeling via `cwd`).
- `projects/<encoded>/<sessionId>.jsonl` → live transcript → status/titel/laatste bericht/tokens.

Status volgt uit de laatste transcript-regel (`tool_use` = bezig, `end_turn` = jouw beurt) plus
of het CLI-proces nog leeft. Optionele Claude-hooks geven directere signalen (zie onder).

## snelste start (dit device)

Vereist Node 18+ en de `code` CLI op PATH.

```bash
npm install
npm run build          # bouwt de PWA
npm start              # host op http://localhost:4317, opent de PWA
```

De console toont je **LAN-URL(s) + een QR-code + (indien nodig) een token**. Scan de QR met je
telefoon (zelfde WiFi) om het paneel daar te openen.

Development met hot reload: `npm run dev` (Vite :5173 + host :4317).

## de host als losstaande app (.exe)

Voor "download-and-run" zonder Node: elke git-tag `v*` bouwt via GitHub Actions een
**`session-panel-host.exe`** en hangt die aan een **GitHub Release**. Dubbelklikken →
de host draait, toont URL/QR/token en opent het dashboard. Lokaal bouwen kan met
`npm run build:exe` (vereist Windows; output in `dist-exe/`).

## de PWA (github.io)

De PWA wordt ook gepubliceerd op **https://erwinschoo.github.io/claude-session-panel-pwa/**
(GitHub Pages, via `.github/workflows/pages.yml`). Open die link op je telefoon → *toevoegen aan
startscherm* → je hebt de app als icoon. Bij de eerste keer kies je **verbind met een host** en
vul je het host-adres + token in (of scan de QR uit de host-console, die vult alles automatisch).

## verbinden — één app, elke bron

Het verbind-scherm kent twee keuzes:
- **host op dit device** — de host draait op deze machine (same-origin).
- **verbind met een host** — een andere PC/laptop via `http://<lan-ip>:4317` of, buiten huis,
  via een Tailscale-adres. Adres + token invoeren of de QR scannen.

Wissel later van host via **instellingen → verbinding → host wijzigen**.

## buiten je huisnetwerk → Tailscale

`localhost` bereikt nooit een ánder apparaat, en buiten je LAN zit je laptop achter NAT. Daarom
is er voor buiten huis een tunnel nodig. We gebruiken **Tailscale** (gratis, privé):

1. Installeer Tailscale op je laptop én telefoon (zelfde account).
2. Zet HTTPS-certificaten aan in de Tailscale-admin (MagicDNS + HTTPS).
3. Op de laptop: `tailscale serve 4317` → je host is bereikbaar op
   `https://<machine>.<tailnet>.ts.net` (echt certificaat, ook `wss`).
4. In de PWA: **verbind met een host** → dat `https://…ts.net`-adres + token.

De host detecteert Tailscale automatisch en toont dit adres + QR bij het opstarten. Alles loopt
privé tussen jóuw apparaten — niets publiek blootgesteld.

> Config: zet `HOST=0.0.0.0` in `server/.env` zodat de host ook op je LAN/tailnet luistert.
> Bij niet-localhost binding wordt automatisch een **token** gegenereerd (zie console).

## prompten & permissies vanaf je telefoon → Claude remote-control

Dit paneel is de **overzicht/status/notificatie**-laag. Voor het daadwerkelijk *prompten* en
*goedkeuren van permissie-gates* op afstand gebruik je Claude's eigen **remote-control**:

- Aanzetten: `claude remote-control`, of `/config` → "Enable Remote Control for all sessions".
- Bedienen via **claude.ai/code** of de **Claude mobiele app** (prompts + gate-choices),
  routeert via Anthropic — geen tunnel nodig.
- De **"open in claude.ai/code"**-knop per sessie brengt je daarheen.

## configuratie (`server/.env`)

| Var | Betekenis |
|---|---|
| `PORT` | Poort van de host (default 4317). |
| `HOST` | `127.0.0.1` = alleen dit device (default). `0.0.0.0` voor LAN/Tailscale. |
| `AUTH_TOKEN` | Vast token; leeg = auto-gegenereerd zodra niet-localhost. |
| `ALLOWED_ORIGINS` | Extra toegestane PWA-origins (github.io staat al toe). |
| `CODE_BIN` | Pad naar de VS Code CLI (default `code`). |
| `OPEN_BROWSER` | `1` = open de PWA automatisch bij starten (de .exe doet dit). |

## optioneel: directe status via hooks

Voor directe "wacht op permissie/input"-signalen voeg je hooks toe aan `~/.claude/settings.json`
die naar de host POSTen (`http://127.0.0.1:4317/hooks`): `PermissionRequest`, `Notification`,
`Stop`, `StopFailure`. De host gebruikt hooks als snel signaal bovenop het file-watchen.

## beperkingen

- Geen deep-link naar een specifieke Claude-*tab*; `open VS Code` focust de juiste *window*.
- Kosten zijn een ruwe schatting (nieuwe/niet-gecachte tokens × modelprijs).
- `open VS Code` heeft alleen zin als je fysiek aan de host-machine zit.

## design

Ontworpen in Claude Design en 1-op-1 geport naar React; brand-tokens in `web/public/_ds/`.

*we commit. we deliver.*
