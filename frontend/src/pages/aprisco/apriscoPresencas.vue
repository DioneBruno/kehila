<template>
  <q-dialog
    :model-value="modelValue"
    :maximized="telaCheia"
    :transition-show="telaCheia ? 'slide-up' : 'scale'"
    :transition-hide="telaCheia ? 'slide-down' : 'scale'"
    @update:model-value="fechar"
    @show="carregar"
  >
    <q-card
      :class="{ column: telaCheia }"
      :style="telaCheia ? '' : 'width: 520px; max-width: 95vw'"
    >
      <q-card-section class="row items-center q-pb-none">
        <p class="text-h6 q-ma-none">Registrar presenças</p>
        <q-space />
        <q-btn flat round dense icon="close" @click="fechar(false)" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-input
          v-model="dataReuniao"
          type="date"
          label="Data *"
          filled
          dense
          @update:model-value="carregarPresencas"
        />
        <div class="row q-col-gutter-sm q-mt-xs">
          <div class="col-6">
            <q-input
              v-model.number="quantidadeCriancas"
              type="number"
              inputmode="numeric"
              min="0"
              label="Crianças"
              filled
              dense
              :disable="carregando"
              :rules="[validarQuantidade]"
              hide-bottom-space
            >
              <template #prepend><q-icon name="child_care" /></template>
            </q-input>
          </div>
          <div class="col-6">
            <q-input
              v-model.number="quantidadeVisitantes"
              type="number"
              inputmode="numeric"
              min="0"
              label="Visitantes"
              filled
              dense
              :disable="carregando"
              :rules="[validarQuantidade]"
              hide-bottom-space
            >
              <template #prepend><q-icon name="person_add" /></template>
            </q-input>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="carregando" class="text-center q-pa-lg">
        <q-spinner color="primary" size="32px" />
      </q-card-section>

      <q-card-section v-else-if="!integrantes.length" class="text-center text-grey-6 q-pa-lg">
        <q-icon name="group_off" size="40px" />
        <p class="q-mt-sm q-mb-none">Este aprisco ainda não possui integrantes.</p>
      </q-card-section>

      <template v-else>
        <q-card-section class="row items-center q-py-sm">
          <span class="text-caption text-grey-7">
            {{ totalPresentes }} de {{ integrantes.length }} presentes
          </span>
          <q-space />
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            :label="todosPresentes ? 'Desmarcar todos' : 'Marcar todos'"
            @click="marcarTodos(!todosPresentes)"
          />
        </q-card-section>

        <q-list
          separator
          class="scroll"
          :class="{ col: telaCheia }"
          :style="telaCheia ? '' : 'max-height: 50vh'"
        >
          <q-item
            v-for="integrante in integrantes"
            :key="integrante.pessoaUuid"
            tag="label"
            v-ripple
          >
            <q-item-section side>
              <q-checkbox v-model="presencas[integrante.pessoaUuid]" color="positive" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ integrante.nome || "Sem nome" }}</q-item-label>
              <q-item-label caption>
                <q-icon :name="papelIntegrante(integrante.papel).icon" size="14px" />
                {{ papelIntegrante(integrante.papel).label }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge
                :color="presencas[integrante.pessoaUuid] ? 'positive' : 'grey-5'"
                :label="presencas[integrante.pessoaUuid] ? 'Presente' : 'Ausente'"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </template>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" color="grey-7" @click="fechar(false)" />
        <q-btn
          unelevated
          label="Salvar"
          icon="save"
          color="primary"
          :disable="!dataReuniao || carregando"
          @click="salvar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import type { Integrante } from "src/@modules/aprisco/aprisco.http";
import { ApriscoService, papelIntegrante } from "./aprisco.service";

/** Data de hoje no fuso local, em AAAA-MM-DD */
function hoje() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Quantidade = number | string | null;

/** Campo vazio = não informado (não é enviado) */
function paraQuantidade(v: Quantidade): number | null {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

export default defineComponent({
  name: "ApriscoPresencas",
  props: {
    modelValue: { type: Boolean, default: false },
    apriscoUuid: { type: String, required: true },
  },
  emits: ["update:modelValue", "salvo"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const $service = new ApriscoService();

    const dataReuniao = ref(hoje());
    const integrantes = ref<Integrante[]>([]);
    const presencas = reactive<Record<string, boolean>>({});
    const carregando = ref(false);
    const quantidadeCriancas = ref<Quantidade>(null);
    const quantidadeVisitantes = ref<Quantidade>(null);

    const validarQuantidade = (v: Quantidade) =>
      !Number.isNaN(paraQuantidade(v)) || "Informe um número inteiro a partir de 0";

    // Celular e tablet (< 1024px): modal em tela cheia
    const telaCheia = computed(() => $q.screen.lt.md);

    const totalPresentes = computed(
      () => integrantes.value.filter((i) => presencas[i.pessoaUuid]).length,
    );
    const todosPresentes = computed(
      () => integrantes.value.length > 0 && totalPresentes.value === integrantes.value.length,
    );

    function marcarTodos(valor: boolean) {
      integrantes.value.forEach((i) => (presencas[i.pessoaUuid] = valor));
    }

    /** Preenche a lista com o que já foi registrado na data (sem registro = ausente) */
    async function carregarPresencas() {
      marcarTodos(false);
      quantidadeCriancas.value = null;
      quantidadeVisitantes.value = null;
      if (!dataReuniao.value) return;
      const registradas = await $service.listarPresencas(props.apriscoUuid, dataReuniao.value);
      registradas?.forEach((p) => {
        if (p.tipo === "INTEGRANTE") {
          if (p.pessoaUuid && p.pessoaUuid in presencas) presencas[p.pessoaUuid] = p.presenca;
        } else if (!p.pessoaUuid) {
          if (p.tipo === "CRIANCA") quantidadeCriancas.value = p.quantidade;
          if (p.tipo === "VISITANTE") quantidadeVisitantes.value = p.quantidade;
        }
      });
    }

    async function carregar() {
      carregando.value = true;
      try {
        dataReuniao.value = hoje();
        integrantes.value = (await $service.listarIntegrantes(props.apriscoUuid)) ?? [];
        Object.keys(presencas).forEach((k) => delete presencas[k]);
        integrantes.value.forEach((i) => (presencas[i.pessoaUuid] = false));
        await carregarPresencas();
      } finally {
        carregando.value = false;
      }
    }

    async function salvar() {
      if (!dataReuniao.value) {
        $q.notify({ type: "warning", message: "Informe a data da reunião" });
        return;
      }
      const criancas = paraQuantidade(quantidadeCriancas.value);
      const visitantes = paraQuantidade(quantidadeVisitantes.value);
      if (Number.isNaN(criancas) || Number.isNaN(visitantes)) {
        $q.notify({ type: "warning", message: "Quantidade inválida" });
        return;
      }

      const registros = integrantes.value.map((i) => ({
        pessoaUuid: i.pessoaUuid,
        presenca: !!presencas[i.pessoaUuid],
      }));
      if (!registros.length && criancas === null && visitantes === null) {
        $q.notify({ type: "warning", message: "Nada para registrar" });
        return;
      }

      const ok = await $service.registrarPresencas(props.apriscoUuid, {
        dataReuniao: dataReuniao.value,
        integrantes: registros,
        criancas,
        visitantes,
      });
      if (ok) {
        emit("salvo");
        fechar(false);
      }
    }

    function fechar(valor: boolean) {
      emit("update:modelValue", valor);
    }

    return {
      dataReuniao,
      integrantes,
      presencas,
      carregando,
      quantidadeCriancas,
      quantidadeVisitantes,
      validarQuantidade,
      telaCheia,
      totalPresentes,
      todosPresentes,
      marcarTodos,
      carregar,
      carregarPresencas,
      salvar,
      fechar,
      papelIntegrante,
    };
  },
});
</script>
