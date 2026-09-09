// Mechanical Rules-of-Hooks audit: every hook call must precede every
// top-level conditional return in a component file.
// Usage: node scripts/hooks-audit.mjs <file.tsx>
import { readFileSync } from "fs";

const file = process.argv[2];
const src = readFileSync(file, "utf8");
const lines = src.split("\n");

const hookRe = /\b(useState|useRef|useEffect|useMemo|useCallback|useReducer|useContext|useLayoutEffect)\s*[<(]/;
const guardRe = /^(return null;|return <[A-Z])/;

const hookLines = [];
const guardLines = [];

lines.forEach((line, i) => {
  if (hookRe.test(line)) hookLines.push(i + 1);
  if (guardRe.test(line.trim())) guardLines.push(i + 1);
});

const lastHook = hookLines.length ? Math.max(...hookLines) : 0;
const firstGuard = guardLines.length ? Math.min(...guardLines) : Infinity;
const violations = hookLines.filter((l) => l > firstGuard);

console.log(`${file}`);
console.log(`  hooks: ${hookLines.length} (last at line ${lastHook || "-"})`);
console.log(`  conditional returns at lines: ${guardLines.length ? guardLines.join(", ") : "none"}`);
if (violations.length) {
  console.error(`  FAIL: hooks called after a conditional return at lines: ${violations.join(", ")}`);
  process.exit(1);
}
console.log("  PASS: all hooks precede all conditional returns");
