<template>
  <q-layout>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { BlankLayoutService } from "./BlankLayout.service";
import { onMounted } from "vue";

const $service = new BlankLayoutService();

onMounted(async () => {
  await ping();
});

async function ping() {
  const response = await $service.ping();
  console.log(response);
}
</script>
