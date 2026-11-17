const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  resolveLocalPath,
  CONTENT_SECURITY_POLICY,
} = require("./local-content.cjs");
const root = path.resolve("dist");
test("sirve el índice y el arte bajo el mismo origen local estable", () => {
  assert.equal(
    resolveLocalPath("reinos://app/", root),
    path.join(root, "index.html"),
  );
  assert.equal(
    resolveLocalPath("reinos://app/art/characters/enano.png", root),
    path.join(root, "art", "characters", "enano.png"),
  );
  assert.equal(
    resolveLocalPath("reinos://app/assets/a.js?v=1#fragment", root),
    path.join(root, "assets", "a.js"),
  );
});
test("rechaza protocolos, hosts y credenciales ajenos", () => {
  for (const url of [
    "file:///etc/passwd",
    "https://app/index.html",
    "reinos://other/index.html",
    "reinos://app:9000/index.html",
    "reinos://user:pass@app/index.html",
  ])
    assert.equal(resolveLocalPath(url, root), null);
});
test("no permite escapar de los recursos incluidos ni separadores de Windows", () => {
  for (const url of [
    "reinos://app/%2e%2e%2fdesktop/main.cjs",
    "reinos://app/%5c..%5cdesktop/main.cjs",
    "reinos://app/%00",
    "reinos://app/%",
  ])
    assert.equal(resolveLocalPath(url, root), null);
});
test("la política solo acepta código local y bloquea objetos y marcos", () => {
  assert.ok(CONTENT_SECURITY_POLICY.includes("script-src 'self'"));
  assert.ok(!CONTENT_SECURITY_POLICY.includes("'unsafe-eval'"));
  assert.ok(CONTENT_SECURITY_POLICY.includes("object-src 'none'"));
  assert.ok(CONTENT_SECURITY_POLICY.includes("frame-src 'none'"));
});
