<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="fechar">
    <q-card style="width: 420px; max-width: 95vw">
      <q-form greedy @submit.prevent="salvar">
        <q-card-section>
          <p class="text-h6 q-ma-none">Registrar pagamento</p>
          <p class="text-caption text-grey-6 q-ma-none">
            Valor da conta: {{ formatarMoeda(conta.valor) }}
          </p>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="form.pagoEm"
            label="Pago em *"
            type="date"
            filled
            stack-label
            :max="hoje()"
            :rules="[(v) => !!v || 'A data do pagamento é obrigatória']"
            lazy-rules
            no-error-icon
          />
          <q-input
            v-model="form.valorPago"
            label="Valor pago (R$)"
            type="number"
            min="0"
            step="0.01"
            filled
            :rules="[(v) => v === '' || Number(v) >= 0 || 'Valor pago inválido']"
            lazy-rules
            no-error-icon
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="fechar(false)" />
          <q-btn unelevated no-caps type="submit" label="Registrar" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, reactive, watch, type PropType } from "vue";
import { hoje } from "./contaForm.vue";
import { ImoveisService, formatarMoeda } from "./imoveis.service";

export default defineComponent({
  name: "ContaPagamentoDialog",
  props: {
    modelValue: { type: Boolean, required: true },
    conta: { type: Object as PropType<{ uuid: string; valor: number }>, required: true },
  },
  emits: ["update:modelValue", "pago"],
  setup(props, { emit }) {
    const $service = new ImoveisService();
    const form = reactive({ pagoEm: hoje(), valorPago: "" });

    // Cada abertura começa com hoje e o valor da conta.
    watch(
      () => props.modelValue,
      (aberto) => {
        if (aberto) {
          form.pagoEm = hoje();
          form.valorPago = String(props.conta.valor);
        }
      },
    );

    function fechar(valor: boolean) {
      emit("update:modelValue", valor);
    }

    async function salvar() {
      const ok = await $service.registrarPagamentoConta(props.conta.uuid, {
        pagoEm: form.pagoEm,
        valorPago: form.valorPago === "" ? props.conta.valor : Number(form.valorPago),
      });
      if (ok) {
        fechar(false);
        emit("pago");
      }
    }

    return { form, fechar, salvar, hoje, formatarMoeda };
  },
});
</script>
