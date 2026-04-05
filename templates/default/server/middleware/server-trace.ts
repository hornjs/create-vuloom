import type { ServerMiddleware } from "phial/server";
import { serverTraceKey } from "../context";

const serverTrace: ServerMiddleware = async (ctx, next) => {
  const url = new URL(ctx.request.url);
  const trace = ctx.get(serverTraceKey);
  const nextTrace = [...trace, `global:${url.pathname}:${ctx.request.method}`];

  ctx.set(serverTraceKey, nextTrace);
  return next(ctx);
};

export default serverTrace;
