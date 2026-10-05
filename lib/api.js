import { SUPABASE_URL as U, SUPABASE_ANON_KEY as K } from "../config.js";

async function rpc(fn, body) {
  const r = await fetch(`${U}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: K,
      Authorization: "Bearer " + K,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json().catch(() => null);
}

export const getPage = (slug) => rpc("get_page", { p_slug: slug });
export const createPage = (slug, code, data) =>
  rpc("create_page", { p_slug: slug, p_code: code, p_data: data });
export const updatePage = (slug, code, data) =>
  rpc("update_page", { p_slug: slug, p_code: code, p_data: data });
