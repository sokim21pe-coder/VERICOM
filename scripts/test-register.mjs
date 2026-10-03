// test-resolve-hook을 ESM 로더로 등록한다(`node --import`에서 사용).
import { register } from "node:module";

register("./test-resolve-hook.mjs", import.meta.url);
