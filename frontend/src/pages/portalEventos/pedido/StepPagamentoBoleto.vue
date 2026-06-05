<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 text-grey-8">
      <div class="">Dados para gerar o boleto</div>
      <div><q-radio v-model="pagador" val="usuarioLogado" label="Dados do usuário logado" /></div>
      <div><q-radio v-model="pagador" val="ingresso" label="Dados de cada ingresso" /></div>
      <div><q-radio v-model="pagador" val="avulso" label="Informar dados do pagador" /></div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, reactive, ref, toRefs } from "vue";

export default defineComponent({
  name: "StepPagamentoBoleto",
  components: {},
  props: {},
  emits: [],
  setup(props, { emit }) {
    const data = reactive({
      pagador: ref("usuarioLogado"),
    });

    return {
      ...toRefs(data),
    };
  },
});
</script>
<style scoped></style>
