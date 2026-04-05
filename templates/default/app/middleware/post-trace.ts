export default async function postTraceMiddleware(
  context: { params: Record<string, string> },
  next: () => Promise<Response | void>,
) {
  void context.params;
  return next();
}
