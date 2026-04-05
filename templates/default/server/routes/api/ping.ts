import type { ServerRequest } from "@hornjs/fest";
import { serverTraceKey } from "../../context";

export default {
  middleware: ["server-trace-route"],
  meta: {
    kind: "api",
  },
  GET(request: ServerRequest) {
    const { searchParams } = new URL(request.url);
    const trace = request.context.get(serverTraceKey);

    return {
      ok: true,
      method: "GET",
      query: searchParams.get("message") ?? null,
      trace,
    };
  },
  async POST(request: ServerRequest) {
    const trace = request.context.get(serverTraceKey);
    const body = await request.text();

    return {
      ok: true,
      method: "POST",
      body: body || null,
      trace,
    };
  },
};
