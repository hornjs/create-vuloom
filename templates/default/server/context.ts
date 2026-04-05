import { createContextKey } from "@hornjs/fest/utils";

export const serverTraceKey = createContextKey<string[]>([]);
