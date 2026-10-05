# LockedIn

Rentry-style course progress tracker. The frontend is static and can be hosted
on GitHub Pages; Supabase stores tracker data and validates edit codes.

## Local setup

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql)
   in its SQL editor.
2. Put the project URL and public anon/publishable key in [`config.js`](./config.js).
   The public key is safe to ship to a browser; the database functions and RLS
   protect tracker data.
3. Start a local HTTP server from the repository root:

   ```sh
   python -m http.server 8000
   ```

4. Open <http://localhost:8000/>. ES modules do not work when `index.html` is
   opened directly with `file://`.
5. Create a tracker, save the edit code, then open the generated link in a
   private window to verify read-only access. Use the edit code to unlock and
   update it. The unlocked editor includes a **Remove** button on each course;
   at least one course is always kept.

## GitHub Pages deployment

The repository includes a GitHub Actions workflow at
[`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml).

1. Push the repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).
4. GitHub will publish the site at
   `https://<account>.github.io/<repository>/`.

No build step is required. Keep the Supabase URL and public key in
[`config.js`](./config.js); never put a Supabase service-role key in this
repository.
