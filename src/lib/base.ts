/**
 * Prefix site-relative paths for GitHub project Pages or custom domain.
 * Always join with a single slash (BASE_URL may or may not end with `/`).
 */
export function withBase(path = ""): string {
  let base = import.meta.env.BASE_URL || "/";
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base = `${base}/`;

  if (!path || path === "/") {
    // Prefer no trailing slash on root (trailingSlash: "never")
    return base === "/" ? "/" : base.slice(0, -1);
  }

  const clean = path.replace(/^\/+/, "");
  return `${base}${clean}`;
}
