# LockedIn

Website link : <https://lockedin-opal-seven.vercel.app/>

A lightweight course progress tracker. Each tracker has a shareable link for viewing and a private edit code for making changes. No accounts required.

## Features

- Set the number of courses, a weight for each, the planned duration in days, and the current day.
- Update each course's completion with a slider.
- Compare weighted overall progress against the progress expected by the current day.
- See the daily pace each course needs to finish on time.
- Edit access is protected by a code generated at creation. Only its SHA-256 hash is stored.

## Tech Stack

- Frontend: HTML, CSS, JavaScript (ES modules)
- Backend: Supabase (PostgreSQL with Row Level Security, accessed through RPC functions)
- Hosting: Vercel
