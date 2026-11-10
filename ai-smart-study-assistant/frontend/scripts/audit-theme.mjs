import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

const frontend = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const source = path.join(frontend, "src");
const cssFile = path.join(source, "index.css");
const css = postcss.parse(fs.readFileSync(cssFile, "utf8"));
const expected = {
  "--color-white": "#f5faff",
  "--color-neon-blue": "#58a6ff",
  "--bg-primary": "#101318",
  "--bg-secondary": "#151a23",
  "--bg-card": "#191f2a",
  "--bg-blue-subtle": "#17263a",
  "--border-neutral": "#2b3544",
};
const found = {};
const problems = [];
const defined = new Set();
css.walkDecls((decl) => {
  if (decl.prop.startsWith("--")) defined.add(decl.prop);
});
css.walkDecls((decl) => {
  for (const [, reference] of decl.value.matchAll(/var\(([^,)]+)/g)) {
    if (!/^--[\w-]+$/.test(reference) || !defined.has(reference)) {
      problems.push(
        `${decl.source.start.line}: invalid or undefined design token ${reference}`,
      );
    }
  }
  const rootToken =
    decl.parent.selector === ":root" && decl.prop.startsWith("--");
  if (rootToken) {
    if (expected[decl.prop]) found[decl.prop] = decl.value.toLowerCase();
    return;
  }
  if (/#[\da-f]{3,8}\b|\brgba?\(/i.test(decl.value)) {
    problems.push(
      `${decl.source.start.line}: ${decl.prop} uses a literal color outside :root`,
    );
  }
  if (
    decl.prop === "color" &&
    !/^var\(--color-(white|neon-blue)\)$/.test(decl.value)
  ) {
    problems.push(
      `${decl.source.start.line}: text uses an unapproved color: ${decl.value}`,
    );
  }
});
assert.deepEqual(
  found,
  expected,
  "The canonical design tokens must match the requested palette.",
);
function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) inspect(file);
    else if (/\.(jsx?|css)$/.test(entry.name) && file !== cssFile) {
      const text = fs.readFileSync(file, "utf8");
      if (/(?:["'`])#[\da-f]{3,8}\b|\brgba?\(\s*\d/i.test(text)) {
        problems.push(
          `${path.relative(source, file)} defines a color outside the shared tokens`,
        );
      }
    }
  }
}
inspect(source);
assert.equal(problems.length, 0, problems.join("\n"));
console.log(
  "Theme audit passed: one white, one blue, centralized surfaces, and no component color overrides.",
);
