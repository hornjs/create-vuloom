import { defineComponent, h } from "vue";
import { useLoaderData, useRoute } from "vuloom/app";

interface RouteData {
  middlewareTrace: string;
  slug: string;
  summary: string;
}

export default defineComponent({
  name: "BlogPostPage",
  setup() {
    const route = useRoute();
    const data = useLoaderData<RouteData>();

    return () =>
      h("section", null, [
        h("h1", null, data.value?.slug ?? "Unknown post"),
        h("p", null, data.value?.summary ?? ""),
        h("p", null, `Middleware trace: ${data.value?.middlewareTrace ?? "missing"}`),
        h("p", null, `Current route path: ${route.value.fullPath}`),
      ]);
  },
});
