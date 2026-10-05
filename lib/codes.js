// 32-char alphabet (no l/o/0/1/i) -> 256 % 32 == 0, so no modulo bias.
const A = "abcdefghjkmnpqrstuvwxyz23456789_";
const rand = (n) =>
  [...crypto.getRandomValues(new Uint8Array(n))].map((x) => A[x % 32]).join("");
export const newSlug = () => rand(8);
export const newCode = () => rand(20).replace(/(.{5})(?=.)/g, "$1-");
