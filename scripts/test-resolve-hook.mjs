// node:test용 모듈 resolve 훅.
// - tsconfig의 "@/..." path alias를 repo 루트 기준으로 해석한다.
// - 확장자 없는 상대/별칭 import를 .ts/.tsx 등으로 해석한다.
// 외부 의존성 없음. `node --experimental-transform-types`가 TS 문법을 처리한다.
import { pathToFileURL, fileURLToPath } from "node:url";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const exts = [".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs", ".json"];

function probe(absNoExt) {
  if (existsSync(absNoExt) && statSync(absNoExt).isFile()) return absNoExt;
  for (const e of exts) {
    if (existsSync(absNoExt + e)) return absNoExt + e;
  }
  for (const e of exts) {
    const idx = path.join(absNoExt, "index" + e);
    if (existsSync(idx)) return idx;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  let abs = null;
  if (specifier.startsWith("@/")) {
    abs = path.join(ROOT, specifier.slice(2));
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const parent = context.parentURL
      ? path.dirname(fileURLToPath(context.parentURL))
      : ROOT;
    abs = path.resolve(parent, specifier);
  }
  if (abs) {
    const resolved = probe(abs);
    if (resolved) {
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
