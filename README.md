# FinBoom

A personal finance dashboard — net worth, assets & liabilities, transactions, budgets, and financial health.

Built with React 19 + Vite + Tailwind CSS v4 + React Router. Data lives in `localStorage` by default; connect a free Firebase project (below) and it becomes a real-time app: sign in with your actual Google account and every change syncs live across every device/tab signed into that account.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Turn on real Google sign-in + live cloud sync (optional but recommended)

Without this step the app still works fully — everything just stays in the browser's `localStorage` on that one device, and "Continue with Google" signs you in locally without a real account.

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project** (free tier is enough).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
3. **Build → Firestore Database → Create database** (start in production mode).
4. In **Project settings → General → Your apps**, add a **Web app** and copy the config values it gives you.
5. Copy `.env.example` to `.env` and paste those values in:
   ```bash
   cp .env.example .env
   ```
6. Deploy the security rules in `firestore.rules` (Firestore → Rules tab, paste and publish) — this restricts each signed-in user to reading/writing only their own document.
7. Restart `npm run dev`. The "Cloud sync not configured" banner on the sign-in screen disappears, and "Continue with Google" now opens a real Google account picker.

How the sync works: each signed-in user's full FinBoom state (assets, liabilities, transactions, budgets, accounts, goals, snapshots, profile, settings) is stored in one Firestore document at `users/{their-uid}`. The app listens to that document in real time (`onSnapshot`), so editing FinBoom on your phone updates it on your laptop within about a second, and vice versa — no refresh needed.

## Build

```bash
npm run build
npm run preview   # serve the production build locally
```

## Deploy — GitHub → Vercel

1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial FinBoom build"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new), import the GitHub repo.
3. Vercel auto-detects the Vite framework preset — Build Command `vite build`, Output Directory `dist`. Leave defaults.
4. If you set up Firebase above, add the same six `VITE_FIREBASE_*` values from your `.env` under **Project Settings → Environment Variables** in Vercel before deploying.
5. In the Firebase console, go to **Authentication → Settings → Authorized domains** and add your Vercel domain (e.g. `your-app.vercel.app`) — Google sign-in will otherwise be blocked on the live site.
6. Deploy. `vercel.json` is already included so client-side routes (e.g. `/app/wealth`) work on refresh.

## Structure

```
src/
  lib/          state store, cloud sync, calculations, formatting, broker import parser
  components/   Sidebar, Topbar, shared UI primitives, modals
  pages/
    auth/       sign in (Google + email via Firebase Auth) + onboarding flow
    wealth/     Assets, Liabilities, Net Worth, Allocation
    money/      Transactions, Budget, Accounts, Insights
    essentials/ Financial health check, Goals
    tools/      Import, Calculators, What's New, Settings, Install, Feedback
```

## Notes

- **Import from Broker** (onboarding and Settings → Import) parses real `.csv` / `.xlsx` / `.xls` files client-side with PapaParse / SheetJS and imports every recognizable holding in the file — there's no cap on row count. It auto-detects common column names (Name/Symbol, Quantity, Avg. Cost, LTP/Current Price); rows missing name, quantity, or cost are skipped and reported, not silently dropped.
- Without Firebase configured, sign-in is a local mock (no server) so you can still try the whole app instantly.
- Firestore's 1&nbsp;MiB per-document limit is generous for this data shape (assets/liabilities/transactions/etc. as JSON) for personal use; if a portfolio import gets very large, consider migrating to Firestore subcollections per data type instead of one document.
