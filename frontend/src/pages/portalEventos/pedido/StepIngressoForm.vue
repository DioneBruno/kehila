<template>
  <div>
    <div class="text-grey-8 q-pb-sm">
      Preencha o formulário abaixo com atenção ao tipo de ingresso!
    </div>

    <q-carousel
      v-model="slide"
      animated
      swipeable
      padding
      navigation-position="bottom"
      control-color="primary"
      class="rounded-borders"
    >
      <q-carousel-slide
        v-for="(ingresso, index) in ingressos"
        :key="ingresso.uuid"
        :name="index"
        class="column no-wrap"
      >
        <div class="row items-center q-mb-md">
          <div>
            <div>
              <q-icon name="confirmation_number" color="primary" size="sm" class="q-mr-xs" />
              <span class="text-subtitle2 text-weight-medium text-grey-8">
                Ingresso {{ Number(index) + 1 }} de {{ ingressos.length }}
              </span>
            </div>
            <div class="text-primary text-weight-medium text-italic">
              Tipo: {{ ingresso.tipoIngressoNome }}
            </div>
          </div>
          <q-space />
          <q-btn
            v-if="Number(index) > 0"
            no-caps
            flat
            dense
            size="sm"
            color="primary"
            icon="content_copy"
            label="Copiar do 1º ingresso"
            @click="copiarDadosPrimeiroIngresso(ingresso)"
          />
        </div>

        <q-form :ref="(el) => setFormRef(ingresso.uuid, el)" greedy class="row q-col-gutter-sm">
          <div class="col-12 col-sm-8">
            <div class="text-grey-8 q-mb-xs">Nome completo *</div>
            <q-input outlined dense v-model="ingresso.pessoaNome" lazy-rules />
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-grey-8 q-mb-xs">CPF *</div>
            <q-input
              outlined
              dense
              unmasked-value
              v-model="ingresso.pessoaDocumento"
              mask="###.###.###-##"
            />
          </div>
          <div class="col-12 col-sm-6">
            <div class="text-grey-8 q-mb-xs">E-mail *</div>
            <q-input outlined dense v-model="ingresso.pessoaEmail" type="email" />
          </div>
          <div class="col-12 col-sm-6">
            <div class="text-grey-8 q-mb-xs">Telefone *</div>
            <q-input
              outlined
              dense
              unmasked-value
              fill-mask
              v-model="ingresso.pessoaTelefone"
              mask="(##) #####-####"
            />
          </div>
          <div class="col-12 col-sm-3">
            <div class="text-grey-8 q-mb-xs">Pais *</div>
            <q-select
              outlined
              dense
              v-model="ingresso.pessoaPais"
              :options="paises"
              emit-value
              map-options
            />
          </div>
          <div class="col-12 col-sm-2">
            <div class="text-grey-8 q-mb-xs">UF *</div>
            <q-select
              outlined
              dense
              v-model="ingresso.pessoaUf"
              :options="ufs"
              emit-value
              map-options
              @update:model-value="
                (uf) => {
                  ingresso.pessoaCidade = '';
                  fetchCidades(uf);
                }
              "
            />
          </div>
          <div class="col-12 col-sm-7">
            <div class="text-grey-8 q-mb-xs">Cidade *</div>
            <q-select
              outlined
              dense
              use-input
              hide-selected
              fill-input
              input-debounce="0"
              v-model="ingresso.pessoaCidade"
              :options="cidadesFiltradas[ingresso.uuid] || []"
              :disable="!ingresso.pessoaUf"
              @filter="(val, update) => filterCidades(val, update, ingresso)"
            />
          </div>
          <div class="col-12 col-md-4">
            <div v-if="!isMobile">
              <div class="text-grey-8 q-mb-xs">Nascimento *</div>
              <q-input outlined dense type="date" v-model="ingresso.formData.dataNascimento" />
            </div>
            <div v-else>
              <div class="text-grey-8 q-mb-xs">Data de Nascimento *</div>
              <div class="row q-col-gutter-xs">
                <div class="col-4">
                  <q-input
                    outlined
                    dense
                    mask="##"
                    inputmode="numeric"
                    placeholder="DD"
                    :rules="[(v) => !v || Number(v) <= 31 || 'Dia inválido']"
                    lazy-rules
                    :model-value="getDataParte(ingresso, 'dia')"
                    @update:model-value="(v) => setDataParte(ingresso, 'dia', String(v ?? ''))"
                  />
                </div>
                <div class="col-4">
                  <q-input
                    outlined
                    dense
                    mask="##"
                    inputmode="numeric"
                    placeholder="MM"
                    :rules="[(v) => !v || Number(v) <= 12 || 'Mês inválido']"
                    lazy-rules
                    :model-value="getDataParte(ingresso, 'mes')"
                    @update:model-value="(v) => setDataParte(ingresso, 'mes', String(v ?? ''))"
                  />
                </div>
                <div class="col-4">
                  <q-input
                    outlined
                    dense
                    mask="####"
                    inputmode="numeric"
                    placeholder="AAAA"
                    :model-value="getDataParte(ingresso, 'ano')"
                    @update:model-value="(v) => setDataParte(ingresso, 'ano', String(v ?? ''))"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-8">
            <div class="text-grey-8 q-mb-xs">Distrito *</div>
            <q-select
              outlined
              dense
              map-options
              emit-value
              v-model="ingresso.formData.distrito"
              :options="districos"
            />
          </div>
          <div class="col-12">
            <div class="row text-grey-8 q-mb-xs">
              <div class="col-12">
                Tem alguma deficiência, necessidade específica ou restrição alimentar?
              </div>
              <div class="col-auto">
                <q-btn-toggle
                  dense
                  no-caps
                  unelevated
                  v-model="ingresso.formData.temDeficienciaOuRestricao"
                  :options="[
                    { label: 'Não', value: 'nao' },
                    { label: 'Sim', value: 'sim' },
                  ]"
                  color="grey-3"
                  text-color="grey-8"
                  toggle-color="primary"
                  toggle-text-color="white"
                />
              </div>
            </div>
          </div>
          <div class="col-12" v-if="ingresso.formData.temDeficienciaOuRestricao === 'sim'">
            <div class="text-grey-8 q-mb-xs">Descrever deficiência *</div>
            <q-input
              outlined
              dense
              type="textarea"
              rows="2"
              v-model="ingresso.formData.deficienciaOuRestricaoDescricao"
              :rules="[(v) => !!v || 'Obrigatório']"
              lazy-rules
            />
          </div>
          <div class="col-12 row q-mt-md row items-center justify-center q-gutter-sm">
            <q-space />
            <q-btn
              v-if="Number(index) >= ingressos.length - 1"
              no-caps
              flat
              color="primary"
              label="Salvar"
              @click="salvarIngresso(ingresso)"
            />
            <q-btn
              v-if="Number(index) < ingressos.length - 1"
              no-caps
              flat
              color="primary"
              icon-right="chevron_right"
              label="Próximo"
              @click="avancarIngresso(ingresso, Number(index))"
            />
          </div>
        </q-form>
      </q-carousel-slide>
    </q-carousel>

    <div class="row items-center justify-center">
      <q-btn
        class="q-mx-xs"
        v-for="(ingresso, index) in ingressos"
        :key="ingresso.uuid"
        :color="
          Number(slide) === index ? 'primary' : ingresso.formDataValido ? 'positive' : 'grey-4'
        "
        :text-color="Number(slide) === index || ingresso.formDataValido ? 'white' : 'grey-7'"
        :label="`${index + 1}`"
        dense
        unelevated
        round
        size="sm"
        @click="slide = index"
      />
    </div>

    <q-stepper-navigation class="row">
      <!-- <q-btn flat label="Voltar" color="grey-7" @click="$emit('prev')" /> -->
      <q-space />
      <q-btn
        v-if="todosIngressosValidos"
        unelevated
        no-caps
        color="positive"
        icon="attach_money"
        label="Avançar para o Pagamento"
        @click="$emit('next')"
      />
      <q-btn
        v-else
        no-caps
        flat
        color="orange-7"
        label="* Preencher todos os campos das inscrições"
      />
    </q-stepper-navigation>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, toRefs } from "vue";
import { useQuasar } from "quasar";
import { PedidoService } from "./pedido.service";
import { usePedidoStore } from "src/stores/pedido";

const paises = [
  { label: "Brasil", value: "BR" },
  { label: "Argentina", value: "AR" },
  { label: "Bolívia", value: "BO" },
  { label: "Chile", value: "CL" },
  { label: "Colômbia", value: "CO" },
  { label: "Paraguai", value: "PY" },
  { label: "Peru", value: "PE" },
  { label: "Uruguai", value: "UY" },
  { label: "Venezuela", value: "VE" },
];

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

const districos = [
  "Visitante",
  "Alto Rio Madeira",
  "Alto Taquari",
  "Amazonico",
  "Bandeirante",
  "Brasil Centro-Oeste",
  "Campos Gerais",
  "Capixaba",
  "Cataratas",
  "Centro Serrano",
  "Concordia",
  "Espirito Santo Norte",
  "Espirito Santo Sul",
  "Fronteira Sul",
  "Gaucho Central",
  "Hortensias",
  "Lago Itaipu",
  "Leste Catarinense",
  "Litoral Norte Gaucho",
  "Mato Grosso",
  "Mato Grosso do Sul",
  "Medio Oeste Catarinense",
  "Mineiro",
  "Missioneiro",
  "Nordeste Catarinense",
  "Nordeste Coqueiros",
  "Nordeste Verdes Mares",
  "Noroeste Gaucho",
  "Norte Mato-Grossense",
  "Oeste Catarinense",
  "Para Norte",
  "Parana Centro",
  "Parana Leste",
  "Parana Norte",
  "Parana Sul",
  "Parque do Iguacu",
  "Paulista",
  "Pioneiro",
  "Planalto",
  "Porto-Alegrense",
  "Rio Aripuana",
  "Rio de Janeiro",
  "Rio Doce",
  "Rio Machado",
  "Rio Uruguai",
  "Salto do Yucuma",
  "Sete Quedas",
  "Sul I",
  "Sul II",
  "Vale do Guapore",
  "Vale do Iguacu",
  "Vale do Itajai",
  "Vale do Rio dos Sinos",
  "Vale do Rio Gravatai",
  "Vale do Rio Ijui",
  "Vale do Rio Pardo",
  "Vale do Rio do Peixe",
  "Vale do Tocantins",
  "Verdes Vales",
  "Videiras",
];

export default defineComponent({
  name: "PortalEventosPedidoStepIngressoForm",
  components: {},
  emits: ["prev", "confirmar"],
  setup() {
    const $q = useQuasar();
    const $service = new PedidoService();
    const $pedidoStore = usePedidoStore();

    const cidadesPorUf = reactive<Record<string, string[]>>({});
    const cidadesFiltradas = reactive<Record<string, string[]>>({});
    const formRefs: Record<string, any> = {};

    function setFormRef(uuid: string, el: any) {
      if (el) formRefs[uuid] = el;
    }

    async function fetchCidades(uf: string) {
      if (!uf || cidadesPorUf[uf]) return;
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
      );
      const data: { nome: string }[] = await response.json();
      cidadesPorUf[uf] = data.map((m) => m.nome).sort();
    }

    function filterCidades(val: string, update: (fn: () => void) => void, ingresso: any) {
      const uf = ingresso.pessoaUf;
      const key = ingresso.uuid;
      const doFilter = () => {
        update(() => {
          const all = cidadesPorUf[uf] || [];
          cidadesFiltradas[key] = val
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

    const data = reactive({
      slide: ref<string | number>(0),
      pedido: computed(() => $pedidoStore.pedido),
      ingressos: computed(() => $pedidoStore.pedido.ingressos ?? []),
      todosIngressosValidos: computed(() =>
        ($pedidoStore.pedido.ingressos ?? []).every((i: any) => i.formDataValido === true),
      ),
      isMobile: computed(() => $q.platform.is.mobile),
      paises: paises.map((pais) => ({ label: pais.label, value: pais.value })),
      ufs: UFS.map((uf) => ({ label: uf, value: uf })),
      districos: districos.map((districo) => ({ label: districo, value: districo })),
    });

    const dataNascimentoPartes = reactive<
      Record<string, { dia: string; mes: string; ano: string }>
    >({});

    function getPartesIngresso(ingresso: any) {
      let partes = dataNascimentoPartes[ingresso.uuid];
      if (!partes) {
        const [ano = "", mes = "", dia = ""] = (ingresso.formData.dataNascimento || "").split("-");
        partes = { dia, mes, ano };
        dataNascimentoPartes[ingresso.uuid] = partes;
      }
      return partes;
    }

    function getDataParte(ingresso: any, parte: "dia" | "mes" | "ano") {
      return getPartesIngresso(ingresso)[parte];
    }

    function setDataParte(ingresso: any, parte: "dia" | "mes" | "ano", valor: string) {
      const partes = getPartesIngresso(ingresso);
      partes[parte] = valor;
      const dia = partes.dia ? partes.dia.padStart(2, "0") : "";
      const mes = partes.mes ? partes.mes.padStart(2, "0") : "";
      const ano = partes.ano ? partes.ano.padStart(4, "0") : "";
      ingresso.formData.dataNascimento = dia || mes || ano ? `${ano}-${mes}-${dia}` : "";
    }

    async function editarFormIngresso(ingresso: any) {
      await $service.editarFormIngresso(ingresso);
    }

    async function salvarIngresso(ingresso: any) {
      const valido = await formRefs[ingresso.uuid]?.validate();
      if (!valido) return;
      await editarFormIngresso(ingresso);
    }

    async function avancarIngresso(ingresso: any, index: number) {
      const valido = await formRefs[ingresso.uuid]?.validate();
      if (!valido) return;
      await editarFormIngresso(ingresso);
      data.slide = index + 1;
    }

    function copiarDadosPrimeiroIngresso(ingresso: any) {
      const primeiro = ($pedidoStore.$state.pedido.ingressos ?? [])[0];
      if (!primeiro) return;
      ingresso.pessoaPais = primeiro.pessoaPais;
      ingresso.pessoaEmail = primeiro.pessoaEmail;
      ingresso.pessoaTelefone = primeiro.pessoaTelefone;
      ingresso.pessoaUf = primeiro.pessoaUf;
      ingresso.pessoaCidade = primeiro.pessoaCidade;
      ingresso.formData = primeiro.formData;
      delete dataNascimentoPartes[ingresso.uuid];
    }

    return {
      ...toRefs(data),
      cidadesFiltradas,
      fetchCidades,
      filterCidades,
      setFormRef,
      salvarIngresso,
      avancarIngresso,
      copiarDadosPrimeiroIngresso,
      getDataParte,
      setDataParte,
    };
  },
});
</script>

<style scoped>
:deep(.q-carousel) {
  height: auto;
}

:deep(.q-carousel__slide) {
  min-height: auto;
}

:deep(.q-panel) {
  height: auto;
  overflow: visible;
}
</style>
