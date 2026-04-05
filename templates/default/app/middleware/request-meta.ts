export default async function requestMetaMiddleware(
  context: { request: Request },
  next: () => Promise<Response | void>,
) {
  void context.request;
  return next();
}
