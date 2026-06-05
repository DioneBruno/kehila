<template>
  <div>Listando cobranças</div>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue";

export default defineComponent({
  name: "StepCobranca",
  setup() {
    const data = reactive({});

    return {
      ...toRefs(data),
    };
  },
});
</script>
<style scoped></style>
