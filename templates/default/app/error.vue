<script setup lang="ts">
defineProps<{
  error?:
    | {
        message?: string;
      }
    | string;
  routeId?: string;
}>();
</script>

<template>
  <main
    data-vuloom-error=""
    style="
      margin: 0 auto;
      max-width: 720px;
      padding: 48px 24px;
      font-family: ui-sans-serif, system-ui;
      line-height: 1.6;
    "
  >
    <h1>Something broke</h1>
    <p>{{ typeof error === "string" ? error : (error?.message ?? "Unexpected error") }}</p>
    <p v-if="routeId" style="color: #6e665d">Failed route: {{ routeId }}</p>
  </main>
</template>
