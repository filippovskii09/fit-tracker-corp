# Local mobile testing over LAN

Use this guide when you need to open the local frontend from a real phone or
tablet on the same Wi-Fi network. This is useful for checking iOS Safari,
installed PWA behavior, touch interactions, sticky headers, scrolling, and real
viewport quirks that browser emulation can miss.

## Localhost vs LAN IP

`localhost` always points to the device where the browser is running.

- On the development computer, `http://localhost:5173` points to the Vite server.
- On an iPhone, `http://localhost:5173` points to the iPhone itself, not the computer.

To open the computer's dev server from a phone, use the computer's LAN IP, for
example `http://192.168.1.25:5173`.

## Start the frontend for LAN access

From the `frontend` directory, run:

```bash
npm run dev:host
```

The script runs Vite with `--host 0.0.0.0`, so it listens on all local network
interfaces. Vite should print both a local URL and a network URL. Open the
network URL from the phone.

You can also run the same behavior manually:

```bash
npm run dev -- --host 0.0.0.0
```

## Find the computer LAN IP

On macOS:

```bash
ipconfig getifaddr en0
```

If the computer uses Ethernet or another interface, check all active interfaces:

```bash
ifconfig
```

Use the private IPv4 address from the same network as the phone, commonly
`192.168.x.x`, `10.x.x.x`, or `172.16.x.x`.

## Open the app from iPhone or another device

1. Connect the phone and the development computer to the same Wi-Fi network.
2. Start the frontend with `npm run dev:host`.
3. Open `http://<computer-lan-ip>:5173` in the phone browser.
4. If the page does not load, allow incoming connections for Node.js in the
   macOS firewall and verify the Vite port is not blocked.

## API URL options

The frontend uses `VITE_API_URL` from `frontend/.env`.

For the deployed Railway backend:

```env
VITE_API_URL=https://fit-tracker-corp-production.up.railway.app/api/v1
```

This is the easiest mode for UI, responsive, Safari, and PWA checks because the
phone only needs to reach the frontend dev server on the local network.

For a local backend on the same computer:

```env
VITE_API_URL=http://<computer-lan-ip>:3000/api/v1
```

Do not use `http://localhost:3000/api/v1` from the phone. From the phone,
`localhost` means the phone itself.

When testing against the local backend, include the LAN frontend origin in
`backend/.env`:

```env
FRONTEND_URL=http://localhost:5173,http://<computer-lan-ip>:5173
```

Restart the backend after changing `FRONTEND_URL`.

## CORS, auth, and cookies

CORS is origin-based. `http://localhost:5173` and
`http://192.168.1.25:5173` are different origins, so the backend must allow the
exact LAN frontend origin when the phone calls a local backend.

The frontend API client sends credentials with requests. Refresh token cookies
are host-specific, so switching between `localhost`, a LAN IP, Netlify, Railway,
and an installed PWA can create separate browser sessions. If auth behaves
strangely, sign out, clear site data for the tested host, and sign in again.

For local development, refresh cookies use `SameSite=Lax` and are not marked
`Secure`. Production cross-site cookies use `SameSite=None; Secure`, which
requires HTTPS.

## PWA and HTTPS limitations

Plain HTTP LAN testing is enough for layout, touch, routing, and many Safari
checks. Some PWA and browser features require a secure context:

- service worker registration is reliable on HTTPS and localhost, but plain LAN
  HTTP can be limited by the browser;
- installed PWA behavior can differ from a normal Safari tab;
- push notifications, advanced storage, and some device APIs may require HTTPS.

Use LAN HTTP for quick real-device feedback. Use the deployed HTTPS frontend for
production-like PWA behavior.

## Real device vs emulation

Chrome device emulation is useful for fast viewport checks, but it does not
fully match iOS Safari, mobile scrolling physics, address bar resizing, touch
targets, installed PWA mode, or real device performance. Real device testing is
the source of truth for those behaviors.

## Troubleshooting

- Phone cannot open the URL: confirm both devices are on the same Wi-Fi and use
  the computer LAN IP, not `localhost`.
- Vite prints only localhost: run `npm run dev:host`.
- Connection times out: allow Node.js in the macOS firewall and check that port
  `5173` is reachable.
- API requests fail with CORS: add the exact LAN frontend origin to
  `FRONTEND_URL` in `backend/.env` and restart the backend.
- API requests go to the wrong machine: use
  `VITE_API_URL=http://<computer-lan-ip>:3000/api/v1` for local backend testing.
- Auth refresh fails after changing hosts: clear site data for the old host and
  sign in again.
