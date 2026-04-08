<script setup lang="ts">
import { computed } from "vue";
import { useAppData } from "phial/app";

interface AppData {
  theme: "light" | "sepia";
  requestedAt: string;
}

const appData = useAppData<AppData>();
const theme = computed(() => appData.value?.theme ?? "sepia");
const bodyStyle = computed(() =>
  theme.value === "light"
    ? "margin: 0; background: #f5f7fb; color: #172033;"
    : "margin: 0; background: #f7f4ef; color: #1b1b18;",
);
</script>

<template>
  <html lang="en">
    <head>
      <title>{{ projectName }}</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body :data-theme="theme" :style="bodyStyle">
      <slot />
    </body>
  </html>
</template>
