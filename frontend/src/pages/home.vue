<template>
  <q-page class="row items-center justify-evenly"> </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue";

export default defineComponent({
  name: "pageHome",
  setup() {
    const data = reactive({});

    return {
      ...toRefs(data),
    };
  },
});
</script>
