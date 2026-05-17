<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title> Quasar App </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { reactive, toRefs } from "vue";
import { useQuasar } from "quasar";
export default {
  name: "MainLayout",
  components: {},
  setup() {
    const $q = useQuasar();

    const data = reactive({
      $q,
    });

    return {
      ...toRefs(data),
    };
  },
};
</script>
