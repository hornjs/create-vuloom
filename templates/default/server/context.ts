import { createContextKey } from "vuloom/server";

export const serverTraceKey = createContextKey<string[]>([]);
