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

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-8">
            <q-input
              outlined
              dense
              stack-label
              v-model="ingresso.pessoaNome"
              label="Nome completo"
              lazy-rules
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-input
              outlined
              dense
              stack-label
              unmasked-value
              v-model="ingresso.pessoaDocumento"
              label="CPF"
              mask="###.###.###-##"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              outlined
              dense
              stack-label
              v-model="ingresso.pessoaEmail"
              label="E-mail"
              type="email"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              outlined
              dense
              stack-label
              unmasked-value
              fill-mask
              v-model="ingresso.pessoaTelefone"
              label="Telefone"
              mask="(##) #####-####"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-select
              outlined
              dense
              stack-label
              v-model="ingresso.pessoaPais"
              label="Pais"
              :options="paises"
              emit-value
              map-options
            />
          </div>
          <div class="col-12 col-sm-2">
            <q-select
              outlined
              dense
              stack-label
              v-model="ingresso.pessoaUf"
              label="UF"
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
            <q-select
              outlined
              dense
              stack-label
              use-input
              hide-selected
              fill-input
              input-debounce="0"
              v-model="ingresso.pessoaCidade"
              label="Cidade"
              :options="cidadesFiltradas[ingresso.uuid] || []"
              :disable="!ingresso.pessoaUf"
              @filter="(val, update) => filterCidades(val, update, ingresso)"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              outlined
              dense
              stack-label
              type="date"
              v-model="ingresso.formData.dataNascimento"
              label="Nascimento"
            />
          </div>
          <div class="col-12 col-md-8">
            <q-select
              outlined
              dense
              stack-label
              map-options
              emit-value
              v-model="ingresso.formData.distrito"
              label="Distrito"
              :options="districos"
            />
          </div>
          <div class="col-12">
            <div class="text-grey-8 q-mb-xs">
              Tem alguma deficiência, necessidade específica ou restrição alimentar?
            </div>
            <q-btn-toggle
              dense
              no-caps
              unelevated
              v-model="ingresso.formData.temDeficienciaOuRestricao"
              :options="[
                { label: 'Sim', value: true },
                { label: 'Não', value: false },
              ]"
              color="grey-3"
              text-color="grey-8"
              toggle-color="primary"
              toggle-text-color="white"
            />
          </div>
          <div class="col-12" v-if="ingresso.formData.temDeficienciaOuRestricao">
            <q-input
              outlined
              dense
              stack-label
              type="textarea"
              autogrow
              v-model="ingresso.formData.deficienciaOuRestricaoDescricao"
              label="Descrever"
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
              @click="editarFormIngresso(ingresso)"
            />
            <q-btn
              v-if="Number(index) < ingressos.length - 1"
              no-caps
              flat
              color="primary"
              icon-right="chevron_right"
              label="Próximo"
              @click="
                editarFormIngresso(ingresso);
                slide = Number(index) + 1;
              "
            />
          </div>
        </div>
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
    </q-stepper-navigation>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, toRefs } from "vue";
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
    const $service = new PedidoService();
    const $pedidoStore = usePedidoStore();

    const cidadesPorUf = reactive<Record<string, string[]>>({});
    const cidadesFiltradas = reactive<Record<string, string[]>>({});

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
      paises: paises.map((pais) => ({ label: pais.label, value: pais.value })),
      ufs: UFS.map((uf) => ({ label: uf, value: uf })),
      districos: districos.map((districo) => ({ label: districo, value: districo })),
    });

    async function editarFormIngresso(ingresso: any) {
      await $service.editarFormIngresso(ingresso);
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
    }

    return {
      ...toRefs(data),
      cidadesFiltradas,
      fetchCidades,
      filterCidades,
      editarFormIngresso,
      copiarDadosPrimeiroIngresso,
    };
  },
});
</script>

<style scoped></style>
