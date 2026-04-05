<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useAppData, useRoute } from "phial";

const route = useRoute();
const appData = useAppData<{ theme: "light" | "sepia" }>();
const theme = computed(() => appData.value?.theme ?? "sepia");
</script>

<template>
  <section>
    <h1>Vue SFC example</h1>
    <p>This route is implemented with a <code>.vue</code> file.</p>
    <ul>
      <li>
        Current path: <strong>{{ route.value.fullPath }}</strong>
      </li>
      <li>
        Theme from app loader: <strong>{{ theme }}</strong>
      </li>
    </ul>
    <p>
      Navigate to the <RouterLink to="/jsx">JSX example</RouterLink> or back to the
      <RouterLink to="/">h() example</RouterLink>.
    </p>
  </section>
</template>
