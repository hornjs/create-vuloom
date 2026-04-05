import { createContextKey } from "phial/server";

export const serverTraceKey = createContextKey<string[]>([]);
