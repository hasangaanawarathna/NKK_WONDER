# NKK Wonder Hotel Guest Guide

A simple React, TypeScript, and Vite website containing the supplied hotel branding, Student Event timetable, floor guide, anonymous online visitor count, and public feedback.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`. Create a production build with `npm run build` and preview it with `npm run preview`.

## GitHub Pages deployment

This is a React + TypeScript application built with Vite. The Vite base path is
configured as `/NKK_WONDER/`, and the workflow publishes the generated `dist`
directory rather than the source files.

In the repository, open **Settings → Pages** and set **Source** to **GitHub
Actions**. Do not select **Deploy from a branch**; that mode serves the root
`index.html`, which intentionally references the Vite development entry point
`/src/main.tsx` and cannot run directly in a browser.

After pushing to `main`, confirm that **Deploy to GitHub Pages** finishes
successfully under the repository's **Actions** tab. Then open
`https://hasangaanawarathna.github.io/NKK_WONDER/` and hard-refresh the page if
an older cached response is shown.

## Contact details

Edit `src/config.ts` and set the real `contact.phone` and `contact.email` values. They become clickable `tel:` and `mailto:` links. Empty values display as not configured; the website does not invent contact details.

## Shared visitor count and feedback

These two features use Supabase without guest accounts or login.

1. Create or reuse a Supabase project.
2. Run `supabase/migrations/202610310002_public_presence_feedback.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add the Supabase project URL and public anon key. Never add the service-role key to frontend files.
5. Restart Vite and redeploy the production build.

Until those values and the migration are configured, the site displays a setup-required message rather than a fake visitor count or local feedback.

### Backend behavior

- Each browser tab has a random anonymous ID stored only in `sessionStorage`; the visitor count is always read from Supabase.
- Visible tabs send a heartbeat every 30 seconds.
- Visitors without a heartbeat for 90 seconds are excluded. Closing a tab also attempts an immediate departure call.
- Feedback is shared through Supabase.
- The database applies a 2–500 character limit and a 30-second per-visitor posting cooldown.
- Direct table access is revoked. Public access is limited to narrowly scoped database functions.

## Guest Comments deployment checklist

The Japanese-first `ご意見・ご感想 / Guest Comments` section reuses the existing
`public_feedback` table and the `list_public_feedback` and
`submit_public_feedback` RPC functions. Do not create another comments table.

1. In Supabase, open **SQL Editor** and run
   `supabase/migrations/202610310002_public_presence_feedback.sql` once. The SQL
   is idempotent and keeps direct anonymous table access revoked.
2. In **Project Settings → API**, copy the Project URL and the public/publishable
   anon key. Never copy the `service_role` key into this project.
3. Create `.env.local` from `.env.example` and set:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
   ```

4. Restart the Vite development server, then run `npm run build`.
5. Commit and push to `main`. In GitHub, select **Settings → Pages → Source:
   GitHub Actions** and wait for the deployment workflow to finish.
6. Open `https://hasangaanawarathna.github.io/NKK_WONDER/`. The configured Vite
   base path is `/NKK_WONDER/`.

The client loads at most 100 newest comments and refreshes the shared list every
30 seconds while the page is visible. Comment text is rendered as React text,
not raw HTML. The database remains responsible for the 2–500 character rule,
50-character name limit, default `Guest` name, and per-visitor posting cooldown.

## Hotel information

- The only event is the supplied Student Event on 15 February 2027.
- Its location is shown as “Please confirm with reception.”
- The fourth floor preserves both supplied rooms labelled `R3` and includes a reception clarification note.
- Floor layouts are schematic and not presented as precise navigation.
