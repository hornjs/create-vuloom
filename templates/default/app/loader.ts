export default async function loadAppData(request: Request) {
  const url = new URL(request.url);

  return {
    theme: url.searchParams.get("theme") === "light" ? "light" : "sepia",
    requestedAt: new Date().toISOString(),
  };
}
