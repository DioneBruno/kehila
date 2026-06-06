<template>
  <div class="row q-col-gutter-md">
    <!-- Cabeçalho boleto -->
    <div class="col-12">
      <div class="row items-center q-gutter-sm q-mb-xs">
        <q-icon name="receipt_long" size="24px" color="primary" />
        <span class="text-subtitle1 text-weight-medium text-grey-9">Pagamento via Boleto</span>
      </div>
      <q-separator />
    </div>

    <!-- Número de parcelas -->
    <div class="col-12 col-sm-6">
      <q-select
        dense
        outlined
        stack-label
        v-model.number="pagador.numParcelas"
        label="Número de parcelas"
        :options="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
        lazy-rules
        :rules="[(val) => (val && val > 0) || 'Campo obrigatório']"
      >
        <template #prepend>
          <q-icon name="splitscreen" color="grey-6" size="18px" />
        </template>
      </q-select>
    </div>

    <!-- Tipo de pagador -->
    <div class="col-12">
      <div
        class="text-caption text-weight-medium text-grey-7 q-mb-sm"
        style="letter-spacing: 0.5px; text-transform: uppercase"
      >
        Dados para gerar o boleto
      </div>
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-4">
          <q-card
            flat
            bordered
            class="cursor-pointer tipo-pagador-card"
            :class="pagador.tipoPagador === 'usuarioLogado' ? 'tipo-pagador-card--active' : ''"
            @click="pagador.tipoPagador = 'usuarioLogado'"
          >
            <q-card-section class="q-pa-sm row items-center q-gutter-x-sm no-wrap">
              <q-radio v-model="pagador.tipoPagador" val="usuarioLogado" dense />
              <div>
                <div class="text-body2 text-weight-medium">Usuário logado</div>
                <div class="text-caption text-grey-6">Usar meus dados</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card
            flat
            bordered
            class="cursor-pointer tipo-pagador-card"
            :class="pagador.tipoPagador === 'ingresso' ? 'tipo-pagador-card--active' : ''"
            @click="pagador.tipoPagador = 'ingresso'"
          >
            <q-card-section class="q-pa-sm row items-center q-gutter-x-sm no-wrap">
              <q-radio v-model="pagador.tipoPagador" val="ingresso" dense />
              <div>
                <div class="text-body2 text-weight-medium">Por ingresso</div>
                <div class="text-caption text-grey-6">Dados de cada ingresso</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card
            flat
            bordered
            class="cursor-pointer tipo-pagador-card"
            :class="pagador.tipoPagador === 'avulso' ? 'tipo-pagador-card--active' : ''"
            @click="pagador.tipoPagador = 'avulso'"
          >
            <q-card-section class="q-pa-sm row items-center q-gutter-x-sm no-wrap">
              <q-radio v-model="pagador.tipoPagador" val="avulso" dense />
              <div>
                <div class="text-body2 text-weight-medium">Informar dados</div>
                <div class="text-caption text-grey-6">Preencher manualmente</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <template v-if="pagador.tipoPagador === 'usuarioLogado'">
      <div class="col-12">
        <q-card flat bordered class="q-pa-sm">
          <q-card-section class="q-pa-xs">
            <div class="row q-col-gutter-sm items-center">
              <div class="col-auto">
                <q-icon name="person" color="primary" size="20px" />
              </div>
              <div class="col">
                <div class="text-body2 text-weight-medium">{{ usuarioLogado.nome }}</div>
                <div class="text-caption text-grey-6">CPF: {{ usuarioLogado.cpf }}</div>
              </div>
            </div>
            <q-separator spaced="xs" />
            <div class="text-caption text-grey-8">
              Será gerado
              <strong>1 carnê</strong>
              parcelado em
              <strong
                >{{ pagador.numParcelas }} vez{{ pagador.numParcelas !== 1 ? "es" : "" }}</strong
              >.
            </div>
          </q-card-section>
        </q-card>
      </div>
    </template>

    <template v-if="pagador.tipoPagador == 'ingresso'">
      <div>
        <p class="q-mb-sm">
          Serão gerados
          <strong>{{ totalIngressos }} carnê{{ totalIngressos !== 1 ? "s" : "" }}</strong>
          — um para cada ingresso do pedido.
        </p>
        <p class="q-mb-none">
          Cada carnê será parcelado em
          <strong>{{ pagador.numParcelas }} vez{{ pagador.numParcelas !== 1 ? "es" : "" }}</strong
          >.
        </p>
      </div>
    </template>

    <!-- Dados do pagador avulso -->
    <template v-if="pagador.tipoPagador === 'avulso'">
      <div class="col-12">
        <q-separator spaced />
        <div
          class="text-caption text-weight-medium text-grey-7 q-mb-sm q-mt-sm"
          style="letter-spacing: 0.5px; text-transform: uppercase"
        >
          Dados do pagador
        </div>
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          dense
          outlined
          stack-label
          v-model="pagador.pagadorNome"
          label="Nome completo"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Campo obrigatório']"
        >
          <template #prepend>
            <q-icon name="person" color="grey-6" size="18px" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          dense
          outlined
          stack-label
          v-model="pagador.pagadorDocumento"
          label="CPF / CNPJ"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Campo obrigatório']"
        >
          <template #prepend>
            <q-icon name="badge" color="grey-6" size="18px" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          dense
          outlined
          stack-label
          v-model="pagador.pagadorEmail"
          label="E-mail"
          type="email"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Campo obrigatório']"
        >
          <template #prepend>
            <q-icon name="email" color="grey-6" size="18px" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          dense
          outlined
          stack-label
          v-model="pagador.pagadorTelefone"
          label="Telefone"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Campo obrigatório']"
        >
          <template #prepend>
            <q-icon name="phone" color="grey-6" size="18px" />
          </template>
        </q-input>
      </div>
      <div class="col-12 text-caption text-grey-8">
        Será gerado
        <strong>1 carnê</strong>
        parcelado em
        <strong>{{ pagador.numParcelas }} vez{{ pagador.numParcelas !== 1 ? "es" : "" }}</strong
        >.
      </div>
    </template>

    <!-- Botão gerar -->
    <div class="col-12 q-pt-sm q-mt-lg">
      <q-btn
        no-caps
        unelevated
        class="full-width"
        color="primary"
        icon="receipt"
        label="Gerar Boleto"
        size="md"
        padding="sm md"
        @click="gerarCobranca"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, reactive, ref, toRefs } from "vue";
import { PedidoService } from "./pedido.service";
import { usePedidoStore } from "src/stores/pedido";
import TokenDecode from "src/@modules/auth/tokenDecode";

export default defineComponent({
  name: "StepPagamentoBoleto",
  components: {},
  props: {},
  emits: [],
  setup(props, { emit }) {
    const $service = new PedidoService();
    const $pedidoStore = usePedidoStore();

    const data = reactive({
      pedido: computed(() => $pedidoStore.$state.pedido),
      pagador: ref({
        pedidoUuid: null,
        numParcelas: 1,
        tipoPagador: "usuarioLogado",
        pagadorNome: "",
        pagadorDocumento: "",
        pagadorEmail: "",
        pagadorTelefone: "",
      }),
      totalIngressos: computed(() => ($pedidoStore.$state.pedido.ingressos ?? []).length),
      usuarioLogado: computed(() => {
        const token = TokenDecode.execute();
        return { nome: token?.user?.name ?? "", cpf: token?.user?.cpf ?? "" };
      }),
    });

    async function gerarCobranca() {
      data.pagador.pedidoUuid = data.pedido.uuid;
      await $service.gerarCobranca(data.pagador);
    }

    return {
      ...toRefs(data),
      gerarCobranca,
    };
  },
});
</script>
<style scoped>
.tipo-pagador-card {
  transition:
    border-color 0.2s,
    background-color 0.2s;
}
.tipo-pagador-card--active {
  border-color: var(--q-primary) !important;
  background-color: rgba(var(--q-primary-rgb, 25, 118, 210), 0.05);
}
</style>
