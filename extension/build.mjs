import { build, context } from "esbuild";
import { cpSync, mkdirSync, existsSync, rmSync } from "fs";

const watch = process.argv.includes("--watch");

if (existsSync("dist")) rmSync("dist", { recursive: true });
mkdirSync("dist/sidepanel", { recursive: true });

cpSync("manifest.json", "dist/manifest.json");
cpSync("src/sidepanel/index.html", "dist/sidepanel/index.html");
cpSync("src/sidepanel/sidepanel.css", "dist/sidepanel/sidepanel.css");

// IIFE avoids needing ES-module support in content scripts / classic service workers.
const commonOptions = {
  bundle: true,
  format: "iife",
  target: "es2020",
  logLevel: "info",
};

const entries = [
  { entry: "src/content/content.ts", outfile: "dist/content.js" },
  { entry: "src/background/background.ts", outfile: "dist/background.js" },
  { entry: "src/sidepanel/sidepanel.ts", outfile: "dist/sidepanel/sidepanel.js" },
];

if (watch) {
  const contexts = await Promise.all(
    entries.map(({ entry, outfile }) => context({ ...commonOptions, entryPoints: [entry], outfile })),
  );
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log("Watching for changes...");
} else {
  await Promise.all(
    entries.map(({ entry, outfile }) => build({ ...commonOptions, entryPoints: [entry], outfile })),
  );
  console.log("Build complete.");
}
