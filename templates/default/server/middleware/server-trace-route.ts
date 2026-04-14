import type { ServerMiddleware } from "vuloom/server";
import { serverTraceKey } from "../context";

const serverTraceRoute: ServerMiddleware = async (ctx, next) => {
  const url = new URL(ctx.request.url);
  const trace = ctx.get(serverTraceKey);
  const nextTrace = [...trace, `route:${url.pathname}:${ctx.request.method}`];

  ctx.set(serverTraceKey, nextTrace);
  return next(ctx);
};

export default serverTraceRoute;
