# UNIBEN LIFE

A responsive campus-life simulation concept inspired by University of Benin campus life. This is an independent project, not an official University of Benin service.

## Features
- Campus-life dashboard, locations, starter jobs, study/rest, wallet, market, inventory and player progression.
- Open access: anyone can play; no UNIBEN student verification is required.
- Local demo mode works without credentials and saves to the current browser.
- Optional Supabase email magic-link authentication and cloud save, so signed-in players can recover game progress across devices.
- Supabase Row Level Security policies restrict each player's profile and save to that authenticated user.

## Run locally
Requires Node.js 18+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase environment variables, the app remains in local demo mode. To enable online accounts and cloud saves:

1. Create a project at https://supabase.com.
2. In the Supabase SQL Editor, run `supabase/migrations/202610090001_initial.sql`.
3. Copy the project URL and anon/public key from the Supabase project API settings into `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. In Supabase Authentication settings, configure the site URL and redirect URLs for your local development URL and final production domain.
5. Configure an email provider/SMTP in Supabase if you want reliable production delivery of sign-in links.
6. Restart the dev server after changing environment variables.

Never put a Supabase `service_role` key in this frontend project. Only use the anon/public key with the provided RLS policies.

## Deploy to Vercel
1. Push this project to a GitHub repository.
2. Import that repository at https://vercel.com.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel project environment variables.
4. Deploy. Vite's production build output is `dist`; `vercel.json` includes an SPA rewrite.
5. Add the Vercel production URL to Supabase Authentication's allowed redirect URLs.

## Custom domain: unibenlife.app
The domain must be registered and controlled by the project owner. In Vercel, add `unibenlife.app` under the project's Domains section and follow the DNS records Vercel provides at the domain registrar. The domain is not automatically purchased or connected by this repository.

## Limitations and security notes
- Cloud features are only active after a real Supabase project has been configured and the SQL migration has been run. Without credentials, the app deliberately stays in local demo mode.
- Cloud save writes the game-state JSON for the authenticated player. For a competitive multiplayer economy, currency changes, purchases and rewards must be moved to server-validated database functions before launch; client-side game state is not cheat-proof.
- The map is illustrative, and virtual money has no real-world value.
- Production build must be verified after dependencies are installed and deployment environment variables are configured.
