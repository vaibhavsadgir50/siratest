# Publish free (any browser, any device)

Use **one [Render](https://render.com) Web Service** (free tier). The app already serves the built React UI and the API from the **same HTTPS host**, so Sira cookies and WebSockets work without Netlify-style proxies.

## Push to GitHub (this folder is already a git repo)

Create an **empty** repo on [github.com/new](https://github.com/new), then from this project directory:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

(Use SSH if you prefer: `git@github.com:YOUR_USER/YOUR_REPO.git`.)

## You do in the browser (once)

1. With the repo on **GitHub** (or GitLab / Bitbucket Render supports).
2. Sign up at **render.com** → **New +** → **Blueprint** (or **Web Service**).
3. Connect the repo; if using Blueprint, select `render.yaml`.
4. In the service → **Environment**, add:
   - **`SIRA_MASTER_SECRET`** — 64 hex characters, e.g. run locally: `openssl rand -hex 32`
   - **`JWT_SECRET`** — long random string (16+ chars), e.g. `openssl rand -base64 32`
5. **Deploy**. When it’s live, open `https://<your-service>.onrender.com`.

`PORT` is set automatically by Render. SQLite lives on the instance disk (fine for demos; data can reset on redeploys or cold starts on free tier).

## Free tier caveats

- The service **spins down** after idle; first load after sleep can take **~30–60s**.
- **No persistent disk** guarantee on free — treat chat DB as disposable unless you upgrade.

## Local vs production

- **Local:** `npm run dev` (Vite + API).
- **Production on Render:** `npm run build` then `npm start` — serves `frontend/dist` from Node (already wired).

No Netlify required for this path.
