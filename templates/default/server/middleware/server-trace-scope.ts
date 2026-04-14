import type { ServerMiddleware } from "vuloom/server";
import { serverTraceKey } from "../context";

const serverTraceScope: ServerMiddleware = async (ctx, next) => {
  const url = new URL(ctx.request.url);
  const trace = ctx.get(serverTraceKey);
  const nextTrace = [...trace, `directory:${url.pathname}:${ctx.request.method}`];

  ctx.set(serverTraceKey, nextTrace);
  return next(ctx);
};

export default serverTraceScope;
