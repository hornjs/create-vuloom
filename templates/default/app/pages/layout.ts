import { computed, defineComponent, h } from "vue";
import { RouterLink, useAppData } from "vuloom/app";

interface AppData {
  theme: "light" | "sepia";
  requestedAt: string;
}

export default defineComponent({
  name: "RootLayout",
  setup(_, { slots }) {
    const appData = useAppData<AppData>();
    const requestedAt = computed(() => appData.value?.requestedAt ?? "");
    const theme = computed(() => appData.value?.theme ?? "sepia");

    return () =>
      h(
        "div",
        {
          style:
            "font-family: ui-sans-serif, system-ui; margin: 0 auto; max-width: 720px; padding: 48px 24px; line-height: 1.6;",
        },
        [
          h(
            "header",
            {
              style:
                "display: flex; gap: 16px; align-items: center; margin-bottom: 32px; flex-wrap: wrap;",
            },
            [
              h("strong", null, "{{projectName}}"),
              h(RouterLink, { to: "/" }, { default: () => "h()" }),
              h(RouterLink, { to: "/jsx" }, { default: () => "JSX" }),
              h(RouterLink, { to: "/sfc" }, { default: () => "SFC" }),
              h(RouterLink, { to: "/blog/hello-world" }, { default: () => "Dynamic Route" }),
              h(
                "span",
                {
                  style: "margin-left: auto; font-size: 13px; color: #6e665d;",
                },
                `theme=${theme.value} · shell=${requestedAt.value}`,
              ),
            ],
          ),
          h("main", null, slots.default?.()),
        ],
      );
  },
});
