/**
 * Stage the static export as the Capacitor web bundle.
 *
 * The mobile build uses its own distDir (.next-mobile) so it never clobbers the
 * web build's cache. Next writes the exported site straight into that directory,
 * so this copies it to out/ — the webDir Capacitor packages.
 *
 * It also rewrites the entry point. The web app's root is the portfolio
 * dashboard, which needs auth and a database; the mobile app ships only the
 * public ticker-to-ideas flow, so the bundle opens there instead. This runs
 * after the mobile export only, and never touches the web build.
 */
import { cpSync, existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const EXPORT_DIR = join(process.cwd(), ".next-mobile");
const OUT_DIR = join(process.cwd(), "out");

if (!existsSync(EXPORT_DIR)) {
  console.error(`prepare-mobile: ${EXPORT_DIR} not found. Did 'cross-env MOBILE_BUILD=1 next build' run?`);
  process.exit(1);
}

rmSync(OUT_DIR, { recursive: true, force: true });
cpSync(EXPORT_DIR, OUT_DIR, { recursive: true });

// Static export emits either out/ideas.html or out/ideas/index.html depending
// on the trailingSlash setting. Accept whichever is present.
const target = existsSync(join(OUT_DIR, "ideas", "index.html"))
  ? "./ideas/index.html"
  : existsSync(join(OUT_DIR, "ideas.html"))
    ? "./ideas.html"
    : null;

if (!target) {
  console.error(`prepare-mobile: no exported /ideas page in out/. Contents: ${readdirSync(OUT_DIR).join(", ")}`);
  process.exit(1);
}

const redirect = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Options Ideas</title>
    <meta http-equiv="refresh" content="0; url=${target}" />
    <style>
      html { color-scheme: dark; }
      body { margin: 0; background: #0b0e11; }
    </style>
  </head>
  <body>
    <script>
      window.location.replace("${target}");
    </script>
  </body>
</html>
`;

writeFileSync(join(OUT_DIR, "index.html"), redirect, "utf8");
console.log(`prepare-mobile: bundle staged in out/, entry point set to ${target}`);
