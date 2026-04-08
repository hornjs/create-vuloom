import { computed, defineComponent, h } from "vue";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useRouteLoaderData,
  useSubmit,
} from "phial/app";

interface LayoutLoaderData {
  fromAppMiddleware: boolean;
  message: string;
  renderedAt: string;
  requestPath: string;
}

interface LayoutActionData {
  ok: boolean;
  message: string;
  submittedAt?: string;
}

export default defineComponent({
  name: "HomePage",
  setup() {
    const data = useLoaderData();
    const layoutData = useRouteLoaderData<LayoutLoaderData>("layout");
    const actionData = useActionData();
    const layoutActionData = useActionData<LayoutActionData>("layout");
    const navigation = useNavigation();
    const submit = useSubmit();
    const renderedAt = computed(() => layoutData.value?.renderedAt ?? "");
    const submittedAt = computed(() => layoutActionData.value?.submittedAt ?? "");
    const feedbackTone = computed(() =>
      layoutActionData.value?.ok === false ? "#8a2d1f" : "#1f5f3b",
    );

    async function handleSubmit(event: Event) {
      const form = event.currentTarget as HTMLFormElement | null;
      if (!form) {
        return;
      }

      event.preventDefault();

      try {
        await submit(form);
      } catch {
        // Keep example errors local so the page shows inline action feedback.
      }
    }

    return () =>
      h("section", null, [
        h("h1", null, "Vue h() example"),
        h(
          "p",
          null,
          "This homepage is implemented with a render function and also demonstrates loader/action data.",
        ),
        h("p", null, [
          "Current page loader: ",
          h("strong", null, data.value ? "available" : "none"),
        ]),
        h("p", null, layoutData.value?.message ?? ""),
        h(
          "p",
          null,
          `App middleware active: ${layoutData.value?.fromAppMiddleware ? "yes" : "no"}`,
        ),
        h("p", null, `Request path seen by middleware: ${layoutData.value?.requestPath ?? "/"}`),
        h("p", null, `SSR time: ${renderedAt.value}`),
        h("ul", null, [
          h("li", null, "Visit /jsx for the Vue JSX example."),
          h("li", null, "Visit /sfc for the Vue single-file component example."),
          h("li", null, "Visit /blog/hello-world for the dynamic route example."),
        ]),
        h(
          "form",
          {
            method: "post",
            onSubmit: handleSubmit,
            style:
              "display: grid; gap: 12px; margin-top: 28px; padding: 18px; border: 1px solid #d9d0c2; border-radius: 14px; background: #fffdfa;",
          },
          [
            h("strong", null, "Action demo"),
            h(
              "label",
              {
                style: "display: grid; gap: 6px;",
              },
              [
                h("span", null, "Your name?"),
                h("input", {
                  name: "name",
                  type: "text",
                  placeholder: "Ada Lovelace",
                  style:
                    "padding: 10px 12px; border: 1px solid #c9bda9; border-radius: 10px; font: inherit;",
                }),
              ],
            ),
            h(
              "div",
              {
                style: "display: flex; gap: 12px; align-items: center; flex-wrap: wrap;",
              },
              [
                h(
                  "button",
                  {
                    type: "submit",
                    disabled: navigation.isSubmitting.value,
                    style:
                      "padding: 10px 14px; border: 0; border-radius: 999px; background: #1b1b18; color: #f7f4ef; font: inherit; cursor: pointer;",
                  },
                  navigation.isSubmitting.value ? "Submitting..." : "Submit action",
                ),
                h(
                  "span",
                  {
                    style: "font-size: 14px; color: #6e665d;",
                  },
                  `Action state: ${navigation.isSubmitting.value ? "submitting" : layoutActionData.value ? "success" : "idle"}`,
                ),
              ],
            ),
            h(
              "p",
              {
                style: "margin: 0; color: #6e665d;",
              },
              `Current page action data: ${actionData.value ? "available" : "none"}`,
            ),
            layoutActionData.value
              ? h(
                  "p",
                  {
                    style: `margin: 0; color: ${feedbackTone.value};`,
                  },
                  layoutActionData.value.message,
                )
              : null,
            layoutActionData.value?.submittedAt
              ? h(
                  "p",
                  {
                    style: "margin: 0; font-size: 14px; color: #6e665d;",
                  },
                  `Submitted at: ${submittedAt.value}`,
                )
              : null,
          ],
        ),
      ]);
  },
});
