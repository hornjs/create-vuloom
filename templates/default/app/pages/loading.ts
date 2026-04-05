import { computed, defineComponent, h } from "vue";

type RouteLoadingProps = {
  routeId: string;
  location: string;
  previousLocation?: string;
  action: string;
};

export default defineComponent({
  name: "ExampleRootLoading",
  props: {
    routeId: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    previousLocation: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      required: true,
    },
  },
  setup(props: RouteLoadingProps) {
    const description = computed(() => {
      const previous = props.previousLocation ? ` from ${props.previousLocation}` : "";
      return `Navigating to ${props.location}${previous} (${props.action})`;
    });

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
