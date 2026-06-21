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

    <div class="col-12" v-if="user.cartoes?.length">
      <q-list bordered separator>
        <q-item
          v-for="c in user.cartoes"
          :key="c.uuid"
          clickable
          v-ripple
          :active="cartaoSelecionadoUuid === c.uuid"
          active-class="bg-blue-1 text-primary"
          @click="cartaoSelecionadoUuid = c.uuid"
        >
          <q-item-section side>
            <q-radio v-model="cartaoSelecionadoUuid" :val="c.uuid" color="primary" />
          </q-item-section>
          <q-item-section avatar>
            <q-icon name="credit_card" size="28px" color="grey-7" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ c.bandeira }} #### #### #### {{ c.numero }}</q-item-label>
            <!-- <q-item-label caption>Status: {{ c.status }}</q-item-label> -->
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="delete"
              color="negative"
              @click.stop="removerCartao(c)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div class="col-12" v-else>
      <q-banner rounded class="bg-grey-2 text-grey-7">
        Nenhum cartão cadastrado.
        <q-btn
          flat
          dense
          no-caps
          size="sm"
          color="primary"
          icon="add"
          label="Incluir"
          @click="abrirDialog"
        />
      </q-banner>
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
                  label="Nome completo *"
                  lazy-rules
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  outlined
                  dense
                  stack-label
                  v-model="formDados.email"
                  label="E-mail *"
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
                  label="Telefone *"
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
                  label="CEP *"
                  :loading="buscandoCep"
                />
              </div>
              <div class="col-12 col-sm-9">
                <q-input
                  outlined
                  stack-label
                  dense
                  v-model="formDados.endereco"
                  label="Endereço *"
                />
              </div>
              <div class="col-12 col-sm-2">
                <q-input
                  outlined
                  stack-label
                  dense
                  v-model="formDados.enderecoNumero"
                  label="Número *"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input outlined stack-label dense v-model="formDados.bairro" label="Bairro *" />
              </div>
              <div class="col-12 col-sm-2">
                <q-select
                  outlined
                  stack-label
                  dense
                  v-model="formDados.uf"
                  label="UF *"
                  :options="ufs"
                  @update:model-value="
                    (uf) => {
                      formDados.cidade = '';
                      fetchCidades(uf);
                    }
                  "
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-select
                  outlined
                  stack-label
                  dense
                  use-input
                  hide-selected
                  fill-input
                  input-debounce="0"
                  v-model="formDados.cidade"
                  label="Cidade *"
                  :options="cidadesFiltradas"
                  :disable="!formDados.uf"
                  @filter="filterCidades"
                />
              </div>
              <div class="col-12 text-orange text-right">* Preenchimento todos os campos</div>
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
                  outlined
                  stack-label
                  dense
                  unmasked-value
                  v-model="cartao.numero"
                  label="Número do cartão"
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
                  outlined
                  stack-label
                  dense
                  v-model="cartao.nome"
                  label="Nome no cartão"
                  placeholder="Como está impresso"
                />
              </div>
              <div class="col-6">
                <q-input
                  outlined
                  stack-label
                  dense
                  v-model="cartao.validade"
                  label="Validade"
                  mask="##/##"
                  placeholder="MM/AA"
                />
              </div>
              <div class="col-6">
                <q-input outlined stack-label dense v-model="cartao.cvv" label="CVV" mask="###" />
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
                  @click="incluirCartao"
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
import { MessageConfirmationService } from "src/shared/message.service";

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
    const $messageConfirmationService = new MessageConfirmationService();
    const $pedidoStore = usePedidoStore();
    const $authStore = useAuthStore();

    const obrigatorio = (v: unknown) => !!v || "Obrigatório";
    const formDadosRef = ref<any>(null);

    const cidadesPorUf = reactive<Record<string, string[]>>({});
    const cidadesFiltradas = ref<string[]>([]);

    const data = reactive({
      user: computed(() => $authStore.$state.user),
      pedido: computed(() => $pedidoStore.$state.pedido),
      mostrarDialog: ref(false),
      cartaoSelecionadoUuid: ref<string | null>(null),
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
        bairro: "",
        cidade: "",
        uf: "",
      }),
      cartao: reactive({
        numero: "",
        nome: "",
        validade: "",
        cvv: "",
      }),
      pagador: ref({
        pedidoUuid: null as string | null,
        numParcelas: 1,
        tipoPagador: "usuarioLogado",
        pagadorNome: "",
        pagadorDocumento: "",
        pagadorEmail: "",
        pagadorTelefone: "",
      }),
    });

    function abrirDialog() {
      data.cartao = {} as any;
      data.formDados.nome = data.user.name ?? "";
      data.formDados.email = data.user.email ?? "";
      data.formDados.telefone = data.user.telefone ?? "";
      data.formDados.cep = data.user.cep ?? "";
      data.formDados.endereco = data.user.endereco ?? "";
      data.formDados.enderecoNumero = data.user.endereco_numero ?? "";
      data.formDados.cidade = data.user.cidade ?? "";
      data.formDados.uf = data.user.uf ?? "";

      const todosPreenchidos = Object.values(data.formDados).every((valor) => !!valor);
      data.tab = todosPreenchidos ? "cartao" : "dados";
      data.mostrarDialog = true;
      void fetchCidades(data.formDados.uf);
    }

    async function fetchCidades(uf: string) {
      if (!uf || cidadesPorUf[uf]) return;
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
      );
      const cidades: { nome: string }[] = await response.json();
      cidadesPorUf[uf] = cidades.map((m) => m.nome).sort();
    }

    function filterCidades(val: string, update: (fn: () => void) => void) {
      const uf = data.formDados.uf;
      const doFilter = () => {
        update(() => {
          const all = cidadesPorUf[uf] || [];
          cidadesFiltradas.value = val
            ? all.filter((c) => c.toLowerCase().includes(val.toLowerCase()))
            : all;
        });
      };
      if (uf && !cidadesPorUf[uf]) {
        void fetchCidades(uf).then(doFilter);
      } else {
        doFilter();
      }
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
        data.formDados.bairro = endereco.bairro ?? "";
        data.formDados.endereco = endereco.logradouro ?? "";
        data.formDados.cidade = endereco.localidade ?? "";
        data.formDados.uf = endereco.uf ?? "";
        void fetchCidades(data.formDados.uf);
        salvarMeusDados();
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

      const todosPreenchidos = Object.values(data.formDados).every((valor) => !!valor);
      if (todosPreenchidos) data.tab = "cartao";
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

    async function incluirCartao() {
      await $service.incluirCartao(data.cartao);
      await $service.verificaUsuario();
      data.mostrarDialog = false;
    }

    async function removerCartao(cartao: any) {
      const confirmacao = await $messageConfirmationService.execute(
        `Deseja realmente remover este cartão, ${cartao.bandeira} •••• ${cartao.numero} ?`,
      );
      if (!confirmacao) return;
      await $service.removerCartao(cartao.uuid);
    }

    return {
      ...toRefs(data),
      formDadosRef,
      cidadesFiltradas,
      removerCartao,
      obrigatorio,
      abrirDialog,
      fetchCidades,
      filterCidades,
      salvarMeusDados,
      gerarCobranca,
      incluirCartao,
    };
  },
});
</script>
