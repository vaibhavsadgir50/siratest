# Step-by-step: publish free on Render

One **Render Web Service** serves the React app, Sira, and REST on **one HTTPS URL** (same origin). Your repo: [github.com/vaibhavsadgir50/siratest](https://github.com/vaibhavsadgir50/siratest).

---

## Part A — Code on GitHub (skip if already done)

1. Commit any local changes:

   ```bash
   git add -A && git status
   git commit -m "Your message"   # if there is anything to commit
   git push
   ```

2. Confirm the default branch is **`main`** and the remote is correct:

   ```bash
   git remote -v
   git branch
   ```

---

## Part B — Create two secrets (on your machine)

The app **will not start** without these. Generate them once and keep them private (never commit them to git).

1. **SIRA_MASTER_SECRET** — exactly 64 hex characters:

   ```bash
   openssl rand -hex 32
   ```

   Copy the whole line into a notes file temporarily.

2. **JWT_SECRET** — at least 16 characters (longer is fine):

   ```bash
   openssl rand -base64 32
   ```

   Copy that value too.

---

## Part C — Render account and GitHub access

1. Open [render.com](https://render.com) and sign up (GitHub login is easiest).
2. When asked, **authorize Render** to access your GitHub account.
3. If prompted, allow access to the **`siratest`** repository (or “All repositories” if you prefer).

---

## Part D — Deploy with the Blueprint (`render.yaml`)

1. In the Render dashboard, click **New +** (top right).
2. Choose **Blueprint**.
3. Under **Connect a repository**, pick **`vaibhavsadgir50/siratest`** (or paste the repo URL if needed).
4. Render should detect **`render.yaml`**. Confirm the blueprint preview shows one **Web Service** named **`siratest`** (Node, free tier).
5. Click **Apply** (or **Create Blueprint** / **Deploy** — exact label varies). This starts the first deploy.

**First build** runs: clone Sira → `npm ci` → `npm run build`. It can take several minutes.

---

## Part E — Add environment variables (required)

If the service crashes on start, it is usually because these are missing.

1. In Render, open **Dashboard** → click the **`siratest`** web service (not the “Blueprint” parent if you see both).
2. Go to the **Environment** tab.
3. Add or edit:

   | Key                   | Value                                      |
   | --------------------- | ------------------------------------------ |
   | `SIRA_MASTER_SECRET`  | paste output of `openssl rand -hex 32`     |
   | `JWT_SECRET`          | paste output of `openssl rand -base64 32`  |

4. Leave **`PORT`** unset (Render injects it). **`HOST`** and **`NODE_VERSION`** should already match `render.yaml`.
5. Click **Save Changes**. Render will **redeploy** automatically.

---

## Part F — Verify it works

1. On the service page, copy the **URL** (e.g. `https://siratest.onrender.com` — yours may differ).
2. Wait until **Status** is **Live** (green). If the service was sleeping, the **first** request after idle can take **~30–60 seconds**.
3. Open the URL in a browser. You should see the app home page.
4. Optional check: open `https://YOUR-SERVICE.onrender.com/health` — you should get a simple OK-style response (not an HTML error page).

---

## Part G — After you change code

```bash
git add -A && git commit -m "Describe change" && git push
```

Render can auto-deploy on push if **Auto-Deploy** is enabled for that service (default is usually on for `main`).

---

## Free tier notes

- **Cold start:** after idle, the first visitor waits while the instance wakes.
- **SQLite:** fine for demos; data may not survive redeploys or instance recycling the way a paid disk would.

---

## Local development (reference)

```bash
npm install    # clones `.sira-src` via preinstall if needed
cp .env.example .env
# Edit .env: set SIRA_MASTER_SECRET (64 hex) and JWT_SECRET (16+ chars)
npm run dev
```

Production on Render uses **`npm run build`** then **`npm start`** (already configured in `render.yaml`).
