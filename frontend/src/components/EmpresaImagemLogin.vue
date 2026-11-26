<template>
  <div>
    <p class="text-caption text-grey-6 q-ma-none q-mb-sm text-uppercase">
      Imagem de fundo da tela de login
    </p>
    <div class="row q-col-gutter-md items-start">
      <div class="col-12 col-sm-6">
        <q-img :src="imagemUrl || IMAGEM_LOGIN_PADRAO" :ratio="16 / 9" fit="cover" class="rounded-borders">
          <div v-if="!imagemUrl" class="absolute-top-left text-caption q-pa-xs">Imagem padrão</div>
        </q-img>
      </div>
      <div class="col-12 col-sm-6 column q-gutter-sm">
        <q-file
          v-model="arquivo"
          label="Escolher imagem"
          filled
          clearable
          :accept="IMAGEM_LOGIN_TIPOS"
          :max-file-size="IMAGEM_LOGIN_TAMANHO_MAXIMO"
          hint="PNG, JPG ou WEBP, até 5 MB. Ideal: paisagem, 1920×1080."
          @rejected="aoRejeitar"
        >
          <template #prepend><q-icon name="image" /></template>
        </q-file>
        <div class="row q-gutter-sm q-mt-md">
          <q-btn
            unelevated
            color="primary"
            icon="upload"
            label="Enviar imagem"
            :disable="!arquivo"
            @click="enviar"
          />
          <q-btn
            v-if="imagemUrl"
            flat
            color="negative"
            icon="delete"
            label="Usar imagem padrão"
            @click="emit('remover')"
          />
        </div>
        <p class="text-caption text-grey-6 q-ma-none">
          A imagem é salva assim que enviada, sem precisar clicar em Salvar.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useQuasar } from "quasar";
import { IMAGEM_LOGIN_PADRAO, IMAGEM_LOGIN_TAMANHO_MAXIMO, IMAGEM_LOGIN_TIPOS } from "./empresaLayout";

defineProps<{ imagemUrl?: string | null | undefined }>();
const emit = defineEmits<{ enviar: [arquivo: File, limpar: () => void]; remover: [] }>();

const $q = useQuasar();
const arquivo = ref<File | null>(null);

function enviar() {
  if (arquivo.value) emit("enviar", arquivo.value, () => (arquivo.value = null));
}

function aoRejeitar() {
  $q.notify({ type: "negative", message: "Use PNG, JPG ou WEBP com até 5 MB" });
}
</script>
