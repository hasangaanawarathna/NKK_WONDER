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

## Hotel information

- The only event is the supplied Student Event on 15 February 2027.
- Its location is shown as “Please confirm with reception.”
- The fourth floor preserves both supplied rooms labelled `R3` and includes a reception clarification note.
- Floor layouts are schematic and not presented as precise navigation.
