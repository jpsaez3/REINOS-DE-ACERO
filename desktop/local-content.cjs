const path = require("node:path");
const CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";
function resolveLocalPath(rawURL, root) {
  try {
    const url = new URL(rawURL);
    if (
      url.protocol !== "reinos:" ||
      url.host !== "app" ||
      url.username ||
      url.password
    )
      return null;
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes("\\") || pathname.includes("\0")) return null;
    const absoluteRoot = path.resolve(root);
    const target = path.resolve(
      absoluteRoot,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    const relative = path.relative(absoluteRoot, target);
    if (
      !relative ||
      relative.startsWith(".." + path.sep) ||
      relative === ".." ||
      path.isAbsolute(relative)
    )
      return null;
    return target;
  } catch {
    return null;
  }
}
module.exports = { resolveLocalPath, CONTENT_SECURITY_POLICY };
