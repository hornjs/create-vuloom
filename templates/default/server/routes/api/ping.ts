import type { InvocationContext } from "phial/server";
import { serverTraceKey } from "../../context";

export default {
  middleware: ["server-trace-route"],
  meta: {
    kind: "api",
  },
  GET(ctx: InvocationContext) {
    const { searchParams } = new URL(ctx.request.url);
    const trace = ctx.get(serverTraceKey);

    return Response.json({
      ok: true,
      method: "GET",
      query: searchParams.get("message") ?? null,
      trace,
    });
  },
  async POST(ctx: InvocationContext) {
    const trace = ctx.get(serverTraceKey);
    const body = await ctx.request.text();

    return Response.json({
      ok: true,
      method: "POST",
      body: body || null,
      trace,
    });
  },
};
