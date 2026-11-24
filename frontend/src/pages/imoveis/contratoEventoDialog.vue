<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="fechar">
    <q-card style="width: 480px; max-width: 95vw">
      <q-form greedy @submit.prevent="salvar">
        <q-card-section>
          <p class="text-h6 q-ma-none">{{ titulo }}</p>
          <p class="text-caption text-grey-6 q-ma-none">
            Vigente até {{ formatarData(contrato.fim) }} ·
            {{ formatarMoeda(contrato.valorAluguel) }}
          </p>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="form.data"
            label="Data do evento *"
            type="date"
            filled
            stack-label
            :rules="[(v) => !!v || 'A data é obrigatória']"
            lazy-rules
            no-error-icon
          />
          <q-input
            v-model="form.descricao"
            label="Descrição *"
            filled
            type="textarea"
            autogrow
            :rules="[(v) => !!v?.trim() || 'A descrição é obrigatória']"
            lazy-rules
            no-error-icon
          />
          <q-input
            v-if="tipo === 'renovacao' || tipo === 'aditivo'"
            v-model="form.fimNovo"
            :label="tipo === 'renovacao' ? 'Novo fim *' : 'Novo fim'"
            type="date"
            filled
            stack-label
            :hint="tipo === 'aditivo' ? 'Informe o novo fim e/ou o novo valor' : undefined"
            :rules="regrasFim"
            lazy-rules
            no-error-icon
          />
          <q-input
            v-if="tipo === 'renovacao' || tipo === 'aditivo'"
            v-model="form.valorNovo"
            label="Novo valor do aluguel (R$)"
            type="number"
            min="0"
            step="0.01"
            filled
            :hint="tipo === 'renovacao' ? 'Deixe em branco para manter o valor' : undefined"
            :rules="regrasValor"
            lazy-rules
            no-error-icon
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="fechar(false)" />
          <q-btn
            unelevated
            no-caps
            type="submit"
            :label="rotuloBotao"
            :color="tipo === 'rescisao' ? 'negative' : 'primary'"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, watch, type PropType } from "vue";
import type { Contrato, ContratoEventoTipo } from "src/@modules/imoveis/contrato.http";
import { ImoveisService, formatarData, formatarMoeda, labelEvento } from "./imoveis.service";

const novoForm = () => ({ data: hoje(), descricao: "", fimNovo: "", valorNovo: "" });

function hoje() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const MENSAGEM_CONFIRMACAO: Partial<Record<ContratoEventoTipo, string>> = {
  encerramento: "Encerrar este contrato? O imóvel ficará livre.",
  rescisao: "Rescindir este contrato? O imóvel ficará livre.",
};

export default defineComponent({
  name: "ContratoEventoDialog",
  props: {
    modelValue: { type: Boolean, required: true },
    tipo: { type: String as PropType<ContratoEventoTipo>, required: true },
    contrato: { type: Object as PropType<Contrato>, required: true },
  },
  emits: ["update:modelValue", "salvo"],
  setup(props, { emit }) {
    const $service = new ImoveisService();
    const form = reactive(novoForm());

    // Cada abertura começa limpa.
    watch(
      () => props.modelValue,
      (aberto) => {
        if (aberto) Object.assign(form, novoForm());
      },
    );

    const semFim = (v: string) => !v;
    const semValor = (v: string) => String(v ?? "").trim() === "";

    const regrasFim = computed(() => [
      (v: string) =>
        props.tipo !== "renovacao" || !semFim(v) || "A renovação precisa de um novo fim",
      (v: string) =>
        props.tipo !== "aditivo" ||
        !semFim(v) ||
        !semValor(form.valorNovo) ||
        "Informe o novo fim e/ou o novo valor",
      (v: string) =>
        semFim(v) ||
        (props.tipo === "renovacao" ? v > props.contrato.fim : v > props.contrato.inicio) ||
        (props.tipo === "renovacao"
          ? "O novo fim deve ser posterior ao fim atual"
          : "O novo fim deve ser posterior ao início"),
    ]);
    const regrasValor = computed(() => [
      (v: string) => semValor(v) || Number(v) >= 0 || "Valor inválido",
    ]);

    const titulo = computed(() => labelEvento(props.tipo));
    const rotuloBotao = computed(
      () =>
        ({
          renovacao: "Renovar",
          aditivo: "Registrar aditivo",
          encerramento: "Encerrar contrato",
          rescisao: "Rescindir contrato",
        })[props.tipo],
    );

    function fechar(valor: boolean) {
      emit("update:modelValue", valor);
    }

    async function salvar() {
      const confirmacao = MENSAGEM_CONFIRMACAO[props.tipo];
      if (confirmacao && !(await $service.confirmar(confirmacao))) return;
      const encerra = !!confirmacao;
      const ok = await $service.registrarEventoContrato(props.contrato.uuid, {
        tipo: props.tipo,
        data: form.data,
        descricao: form.descricao.trim(),
        ...(encerra
          ? {}
          : {
              fimNovo: form.fimNovo || null,
              valorNovo: semValor(form.valorNovo) ? null : Number(form.valorNovo),
            }),
      });
      if (ok) {
        fechar(false);
        emit("salvo");
      }
    }

    return {
      form,
      titulo,
      rotuloBotao,
      regrasFim,
      regrasValor,
      fechar,
      salvar,
      formatarData,
      formatarMoeda,
    };
  },
});
</script>
