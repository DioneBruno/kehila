<template>
  <div class="row q-col-gutter-md q-mt-md">
    <div class="col-12">
      <q-separator />
    </div>
    <div class="col-12">
      <q-btn
        no-caps
        flat
        color="primary"
        icon="add"
        label="Incluir Cartão de Credito"
        class="full-width"
        @click="abrirDialog"
      />
    </div>

    <q-dialog v-model="mostrarDialog">
      <q-card style="width: 700px; max-width: 95vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-weight-medium">Incluir Cartão de Crédito</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-separator />
        <q-tabs
          v-model="tab"
          class="text-grey-7"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="dados" icon="person" label="Meus dados" />
          <q-tab name="cartao" icon="credit_card" label="Cartão" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="dados">
            <q-form ref="formDadosRef" greedy class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  outlined
                  dense
                  stack-label
                  v-model="formDados.nome"
                  label="Nome completo"
                  lazy-rules
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  outlined
                  dense
                  stack-label
                  v-model="formDados.email"
                  label="E-mail"
                  type="email"
                  lazy-rules
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  outlined
                  unmasked-value
                  fill-mask
                  dense
                  v-model="formDados.telefone"
                  label="Telefone"
                  mask="(##) #####-####"
                />
              </div>
              <div class="col-12 col-sm-3">
                <q-input
                  outlined
                  dense
                  stack-label
                  unmasked-value
                  fill-mask
                  mask="#####-###"
                  v-model="formDados.cep"
                  label="CEP"
                  :loading="buscandoCep"
                />
              </div>
              <div class="col-12 col-sm-9">
                <q-input outlined stack-label dense v-model="formDados.endereco" label="Endereço" />
              </div>
              <div class="col-12 col-sm-3">
                <q-input
                  outlined
                  stack-label
                  dense
                  v-model="formDados.enderecoNumero"
                  label="Número"
                />
              </div>
              <div class="col-12 col-sm-2">
                <q-select
                  outlined
                  stack-label
                  dense
                  v-model="formDados.uf"
                  label="UF"
                  :options="ufs"
                />
              </div>
              <div class="col-12 col-sm-7">
                <q-input outlined stack-label dense v-model="formDados.cidade" label="Cidade" />
              </div>
              <div class="col-12 row justify-end q-mt-sm">
                <q-btn
                  flat
                  no-caps
                  unelevated
                  color="primary"
                  icon="save"
                  label="Salvar dados"
                  class="full-width"
                  @click="salvarMeusDados"
                />
              </div>
            </q-form>
          </q-tab-panel>

          <q-tab-panel name="cartao">
            <q-form class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="pagador.cartao.numero"
                  label="Número do cartão"
                  outlined
                  mask="#### #### #### ####"
                  placeholder="0000 0000 0000 0000"
                >
                  <template v-slot:append>
                    <q-icon name="credit_card" color="grey-5" />
                  </template>
                </q-input>
              </div>
              <div class="col-12">
                <q-input
                  v-model="pagador.cartao.nome"
                  label="Nome no cartão"
                  outlined
                  placeholder="Como está impresso"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="pagador.cartao.validade"
                  label="Validade"
                  outlined
                  mask="##/##"
                  placeholder="MM/AA"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="pagador.cartao.cvv"
                  label="CVV"
                  outlined
                  mask="###"
                  type="password"
                />
              </div>
              <!-- <div class="col-12">
                <q-select
                  v-model="pagador.numParcelas"
                  label="Parcelas"
                  outlined
                  :options="opcoesParcelas"
                  emit-value
                  map-options
                />
              </div> -->
              <div class="col-12 row justify-end q-mt-sm">
                <q-btn
                  no-caps
                  unelevated
                  flat
                  class="full-width"
                  label="Incluir Cartão"
                  color="primary"
                  icon="credit_card"
                  @click="confirmarPagamentoCartao"
                />
              </div>
            </q-form>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { computed, defineComponent, reactive, ref, toRefs, watch } from "vue";
import { Notify } from "quasar";
import { PedidoService } from "./pedido.service";
import { usePedidoStore } from "src/stores/pedido";
import { useAuthStore } from "src/stores/auth";

interface OpcaoParcela {
  label: string;
  value: number;
}

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export default defineComponent({
  name: "StepPagamentoCartao",
  props: {
    opcoesParcelas: { type: Array as PropType<OpcaoParcela[]>, required: true },
  },
  emits: ["update:cartao"],
  setup(props, { emit }) {
    const $service = new PedidoService();
    const $pedidoStore = usePedidoStore();
    const $authStore = useAuthStore();

    const obrigatorio = (v: unknown) => !!v || "Obrigatório";
    const formDadosRef = ref<any>(null);

    const data = reactive({
      user: computed(() => $authStore.$state.user),
      pedido: computed(() => $pedidoStore.$state.pedido),
      mostrarDialog: ref(false),
      tab: ref("dados"),
      ufs: UFS,
      buscandoCep: ref(false),
      formDados: reactive({
        nome: "",
        email: "",
        telefone: "",
        cep: "",
        endereco: "",
        enderecoNumero: "",
        cidade: "",
        uf: "",
      }),
      pagador: ref({
        pedidoUuid: null as string | null,
        numParcelas: 1,
        tipoPagador: "usuarioLogado",
        pagadorNome: "",
        pagadorDocumento: "",
        pagadorEmail: "",
        pagadorTelefone: "",
        cartao: reactive({
          numero: "",
          nome: "",
          validade: "",
          cvv: "",
        }),
      }),
    });

    function abrirDialog() {
      data.formDados.nome = data.user.name ?? "";
      data.formDados.email = data.user.email ?? "";
      data.formDados.telefone = data.user.telefone ?? "";
      data.formDados.endereco = data.user.endereco ?? "";
      data.formDados.enderecoNumero = data.user.endereco_numero ?? "";
      data.formDados.cidade = data.user.cidade ?? "";
      data.formDados.uf = data.user.uf ?? "";
      data.tab = "dados";
      data.mostrarDialog = true;
    }

    async function buscarEndereco(cep: string) {
      data.buscandoCep = true;
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const endereco = await response.json();
        if (endereco.erro) {
          Notify.create({ color: "negative", message: "CEP não encontrado", position: "bottom" });
          return;
        }
        data.formDados.endereco = endereco.logradouro ?? "";
        data.formDados.cidade = endereco.localidade ?? "";
        data.formDados.uf = endereco.uf ?? "";
      } catch {
        Notify.create({ color: "negative", message: "Erro ao buscar o CEP", position: "bottom" });
      } finally {
        data.buscandoCep = false;
      }
    }

    watch(
      () => data.formDados.cep,
      (cep) => {
        if (cep?.length === 8) void buscarEndereco(cep);
      },
    );

    async function salvarMeusDados() {
      const valido = await formDadosRef.value?.validate();
      if (!valido) return;
      await $service.editarPerfil(data.formDados);
    }

    async function gerarCobranca() {
      data.pagador.pedidoUuid = data.pedido.uuid;
      const [mes, ano] = data.pagador.cartao.validade.split("/");
      const payload = {
        pedidoUuid: data.pagador.pedidoUuid,
        numParcelas: data.pagador.numParcelas,
        tipoPagador: data.pagador.tipoPagador,
        tipoCobranca: "cartaoCredito",
        cartaoCredito: {
          numeroCartao: data.pagador.cartao.numero.replace(/\s/g, ""),
          nomeNoCartao: data.pagador.cartao.nome,
          mesVencimento: mes,
          anoVencimento: ano,
          codigoSeguranca: data.pagador.cartao.cvv,
        },
      };
      await $service.gerarCobranca(payload);
    }

    async function confirmarPagamentoCartao() {
      await gerarCobranca();
      data.mostrarDialog = false;
    }

    return {
      ...toRefs(data),
      formDadosRef,
      obrigatorio,
      abrirDialog,
      salvarMeusDados,
      gerarCobranca,
      confirmarPagamentoCartao,
    };
  },
});
</script>
