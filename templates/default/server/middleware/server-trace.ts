import type { ServerMiddleware } from "@hornjs/fest";
import { serverTraceKey } from "../context";

const serverTrace: ServerMiddleware = async (request, next) => {
  const url = new URL(request.url);
  const trace = request.context.get(serverTraceKey);
  const nextTrace = [...trace, `global:${url.pathname}:${request.method}`];

  request.context.set(serverTraceKey, nextTrace);
  return next(request);
};

export default serverTrace;
