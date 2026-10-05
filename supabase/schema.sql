create extension if not exists pgcrypto;

create table pages (
  slug text primary key,
  edit_hash text not null,
  data jsonb not null check (pg_column_size(data) < 20000),
  updated_at timestamptz default now()
);
alter table pages enable row level security; -- no policies: only the functions below can touch it

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
