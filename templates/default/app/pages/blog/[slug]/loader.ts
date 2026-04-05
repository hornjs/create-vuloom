export async function loader({ params }: { params: Record<string, string> }) {
  await new Promise((resolve) => setTimeout(resolve, 220));
  const slug = params.slug ?? "unknown";

  return {
    slug,
    middlewareTrace: `directory:${slug} > route:${slug}`,
    summary: `Loaded post "${slug}" through a file route.`,
  };
}
