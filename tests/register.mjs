// Registers the `@/` alias resolution hook for the Node.js test runner.
// Used via `node --import ./tests/register.mjs --test ...` (see `npm test`).
import { register } from "node:module";

register("./resolve-alias.mjs", import.meta.url);
