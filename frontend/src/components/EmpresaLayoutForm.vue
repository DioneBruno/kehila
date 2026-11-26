<template>
  <div class="row q-col-gutter-md">
    <div v-for="secao in secoes" :key="secao.chave" class="col-12 col-md-6">
      <p class="text-caption text-grey-6 q-ma-none q-mb-sm text-uppercase">{{ secao.rotulo }}</p>
      <div class="column q-gutter-sm">
        <q-input
          :model-value="modelValue[secao.chave].titulo"
          label="Título"
          filled
          maxlength="120"
          :readonly="readonly"
          :placeholder="LAYOUT_PADRAO[secao.chave].titulo"
          :hint="readonly ? undefined : `Vazio usa “${LAYOUT_PADRAO[secao.chave].titulo}”`"
          @update:model-value="(v) => atualizar(secao.chave, 'titulo', v)"
        />
        <q-input
          :model-value="modelValue[secao.chave].subTitulo"
          label="Subtítulo"
          filled
          maxlength="120"
          :readonly="readonly"
          :placeholder="LAYOUT_PADRAO[secao.chave].subTitulo"
          :hint="
            readonly || !LAYOUT_PADRAO[secao.chave].subTitulo
              ? undefined
              : `Vazio usa “${LAYOUT_PADRAO[secao.chave].subTitulo}”`
          "
          @update:model-value="(v) => atualizar(secao.chave, 'subTitulo', v)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LAYOUT_PADRAO, type LayoutForm, type LayoutSecaoForm } from "./empresaLayout";

const props = withDefaults(defineProps<{ modelValue: LayoutForm; readonly?: boolean }>(), {
  readonly: false,
});
const emit = defineEmits<{ "update:modelValue": [valor: LayoutForm] }>();

const secoes: { chave: keyof LayoutForm; rotulo: string }[] = [
  { chave: "header", rotulo: "Cabeçalho (topo do painel)" },
  { chave: "telaLogin", rotulo: "Tela de login (e título da aba)" },
];

function atualizar(secao: keyof LayoutForm, campo: keyof LayoutSecaoForm, valor: unknown) {
  emit("update:modelValue", {
    ...props.modelValue,
    [secao]: { ...props.modelValue[secao], [campo]: typeof valor === "string" ? valor : "" },
  });
}
</script>
