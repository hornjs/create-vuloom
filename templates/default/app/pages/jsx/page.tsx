import { computed, defineComponent } from "vue";
import { RouterLink, useAppData, useRoute } from "vuloom/app";

interface AppData {
  theme: "light" | "sepia";
}

export default defineComponent({
  name: "JsxExamplePage",
  setup() {
    const route = useRoute();
    const appData = useAppData<AppData>();
    const theme = computed(() => appData.value?.theme ?? "sepia");

    return () => (
      <section>
        <h1>Vue JSX example</h1>
        <p>
          This route is implemented with a <code>.tsx</code> file.
        </p>
        <ul>
          <li>
            Current path: <strong>{route.value.fullPath}</strong>
          </li>
          <li>
            Theme from app loader: <strong>{theme.value}</strong>
          </li>
        </ul>
        <p>
          Navigate to the <RouterLink to="/sfc">SFC example</RouterLink> or back to the{" "}
          <RouterLink to="/">h() example</RouterLink>.
        </p>
      </section>
    );
  },
});
