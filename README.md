# NetWorth Tracker

Private, multi-currency net worth tracker. Next.js 14 + Tailwind + Firebase (Auth + Firestore), hosted on Vercel.
Everything runs on free plans (Firebase Spark, Vercel Hobby, GitHub free).

**Features:** email/Google login, assets and liabilities in 17 currencies, live exchange rates,
net worth in your chosen display currency, allocation chart, currency exposure, daily snapshots
with a history chart, and a "hide amounts" privacy toggle.

## 1. Firebase setup (free, no card)

1. https://console.firebase.google.com → Add project (turn Google Analytics off).
2. Build → **Authentication** → Get started → Sign-in method: enable **Email/Password** and **Google**
   (for Google, pick a support email and Save).
3. Build → **Firestore Database** → Create database → choose a location near you → start in
   **production mode**.
4. Firestore → **Rules** tab → replace everything with the contents of `firestore.rules` → Publish.
   This makes each user able to read and write only their own data.
5. Project settings (gear icon) → General → "Your apps" → add a **Web app** (`</>`) → register it
   (skip Firebase Hosting). Copy the four values (apiKey, authDomain, projectId, appId).

## 2. Run locally (optional)

```bash
cp .env.example .env.local   # paste the four Firebase values
npm install
npm run dev                  # http://localhost:3000
```

## 3. GitHub + Vercel

Push to a **private** GitHub repo, then in Vercel: Add New → Project → import the repo → add the
four `NEXT_PUBLIC_FIREBASE_*` variables from `.env.example` → Deploy.

Then in Firebase → Authentication → Settings → **Authorized domains** → Add domain → your Vercel
address (e.g. `networth-tracker-xyz.vercel.app`, no https://). Without this, Google login is blocked.

## Notes

- Firebase web config values are not secrets; Firestore rules protect the data.
- Exchange rates come from open.er-api.com (free, no key) via `/api/rates`, cached for 1 hour.
  If rates fail to load, foreign-currency amounts show "—" instead of a wrong number.
- Every amount keeps its original currency; conversion happens only for display.
- Snapshots store the display currency they were taken in; the chart shows the ones that
  match the current display currency.
- Data layout: `users/{uid}` (display currency), `users/{uid}/holdings/*`, `users/{uid}/snapshots/{date}`.

## Next steps

Transactions, budget, goals, health score and CSV import.
