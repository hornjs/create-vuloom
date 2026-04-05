import { defineComponent, h } from "vue";

type RouteLoadingProps = {
  routeId: string;
  location: string;
};

export default defineComponent({
  name: "ExampleBlogLoading",
  props: {
    routeId: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
  },
  setup(props: Pick<RouteLoadingProps, "routeId" | "location">) {
    return () =>
      h(
        "article",
        {
          style:
            "display: grid; gap: 12px; margin-top: 12px; padding: 18px; border-radius: 14px; background: #f5f5f2; border: 1px solid #dad8d1;",
        },
        [
          h(
            "h1",
            {
              style: "margin: 0;",
            },
            "Loading blog article...",
          ),
          h(
            "p",
            {
              style: "margin: 0; color: #6c6c66;",
            },
            `Preparing ${props.location}`,
          ),
        ],
      );
  },
});
