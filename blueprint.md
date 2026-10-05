Yes, I get it: a rentry-style page per tracker (public link to view, edit code to modify), showing weighted overall progress versus the progress you should have by today.

One catch: GitHub Pages is static only, so it can't store pages or check edit codes. You need a tiny backend. Best fit: Supabase (free tier, Postgres, no server code). Alternative is Cloudflare Workers + KV. A zero-backend option (state encoded in the URL) exists but has no real edit code, so it isn't rentry-like.

BLUEPRINT

Stack
Frontend: plain HTML/CSS/ES modules on GitHub Pages. Backend: Supabase table + 3 SQL functions, called from the browser with the public anon key. Three.js later via importmap/CDN.

Files
index.html, style.css, app.js (routing, UI), lib/calc.js (pure math), lib/api.js (Supabase calls), scene.js (three.js, later)

Routing
Pages has no rewrites, so use hash routes: /#/ = create page, /#/abc123xy = view/edit page.

Data model (one row per tracker)
slug (8 random chars), edit_hash, data (jsonb), updated_at

data = { totalDays, currentDay, courses: [ {name, weight, pct} ] }

Number of courses is just courses.length (not hardcoded to 5).

Flow

1. Create: client generates slug + edit code (crypto.getRandomValues, 16+ chars). Insert row. Show the edit code once with a copy button. Server stores only its SHA-256 hash.
2. View: anyone with the link loads data read-only.
3. Edit: enter the edit code, unlock sliders and fields, save silently through update_page. Cache the code in localStorage so you stay unlocked on your device; only save errors are shown.
4. Autosave on slider release (debounced), not on every tick.

Math (calc.js)

```js
const expected = Math.min(100, (currentDay / totalDays) * 100);
const totalW = courses.reduce((s, c) => s + c.weight, 0);
const actual = courses.reduce((s, c) => s + c.weight * c.pct, 0) / totalW;
const delta = actual - expected; // ahead (+) / behind (-)
const perDay = (100 - c.pct) / Math.max(1, totalDays - currentDay + 1); // per course
```

Each course box shows its slider, its pct, and actual versus planned progress as two labeled comparison lines, plus required pct/day to catch up. Header shows actual progress and planned progress as two labeled comparison lines, with a clear ahead/behind delta. Optionally store startDate and compute currentDay automatically, with manual override.

The course editor should show an explicit `Weight` label and provide both a slider and a numeric manual entry for progress percentage. Courses cannot be deleted after creation. The layout should remain usable on narrow mobile screens as well as desktop.

Supabase SQL (run once)

```sql
create extension if not exists pgcrypto;

create table pages (
  slug text primary key,
  edit_hash text not null,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table pages enable row level security;  -- no policies: table is unreachable directly

create function get_page(p_slug text) returns jsonb
language sql security definer set search_path = public as
$$ select data from pages where slug = p_slug $$;

create function create_page(p_slug text, p_code text, p_data jsonb) returns void
language sql security definer set search_path = public, extensions as
$$ insert into pages(slug, edit_hash, data)
   values (p_slug, encode(digest(p_code,'sha256'),'hex'), p_data) $$;

create function update_page(p_slug text, p_code text, p_data jsonb) returns boolean
language plpgsql security definer set search_path = public, extensions as
$$ begin
  update pages set data = p_data, updated_at = now()
  where slug = p_slug and edit_hash = encode(digest(p_code,'sha256'),'hex');
  return found;
end $$;
```

Because RLS blocks direct table access, the anon key can only do what those three functions allow. The edit code is the only write credential, so keep it high-entropy and never store it plaintext server-side.

Animation-ready design
Keep one state object and a single render(state) function. The DOM UI and scene.js both subscribe to the same state, so later you can map each course's pct to a Three.js element (rising bars, orbiting spheres, a ship vs a "target" ghost ship) without touching the data layer. CSS transitions on bars/sliders cover the first pass.

Build order

1. calc.js + static page with local state (no backend)
2. Supabase setup + api.js + create/view flow
3. Edit code unlock + autosave
4. Styling, mobile layout
5. GitHub Pages deploy (Settings > Pages > main branch)
6. three.js scene

Extras worth considering: a title field per tracker, a basic rate limit on create_page, and a delete/reset option protected by the edit code.
