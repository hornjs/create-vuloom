export async function loader({ request }: { request: Request }) {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const url = new URL(request.url);

  return {
    fromAppMiddleware: true,
    requestPath: url.pathname,
    message: "Hello from the root page loader.",
    renderedAt: new Date().toISOString(),
  };
}
