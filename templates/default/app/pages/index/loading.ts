import { computed, defineComponent, h } from "vue";
import type { PageRouteRecord } from "vuloom/app";

type RouteLoadingProps = {
  route: PageRouteRecord;
};

export default defineComponent({
  name: "ExampleRootLoading",
  props: {
    route: {
      type: Object,
      required: true,
    },
  },
  setup(props: RouteLoadingProps) {
    const description = computed(() => `Navigating to ${props.route.path ?? "/"}`);

    return () =>
      h(
        "section",
        {
          style:
            "margin-top: 24px; padding: 18px; border: 1px dashed #c9bda9; border-radius: 14px; background: #f7f1e8; color: #6a5843;",
        },
        [
          h("strong", null, "Root layout loading..."),
          h(
            "p",
            {
              style: "margin: 10px 0 0;",
            },
            description.value,
          ),
        ],
      );
  },
});
