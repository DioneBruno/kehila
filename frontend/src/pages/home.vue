<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-4 col-md-2 cursor-pointer">
        <q-card>
          <q-card-section>
            <div class="text-h6">Home</div>
          </q-card-section>
          <q-card-section>
            <div class="text-subtitle1">Home</div>
          </q-card-section>
          <q-card-section> </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
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
