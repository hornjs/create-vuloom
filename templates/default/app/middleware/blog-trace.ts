export default async function blogTraceMiddleware(
  context: { params: Record<string, string> },
  next: () => Promise<Response | void>,
) {
  void context.params;
  return next();
}
