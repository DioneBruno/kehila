<template>
  <div>
    <div class="text-grey-8 q-pb-sm">Preencha os dados para cada ingresso</div>

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
          <q-icon name="confirmation_number" color="primary" size="sm" class="q-mr-xs" />
          <span class="text-subtitle2 text-weight-medium text-grey-8">
            Ingresso {{ Number(index) + 1 }} de {{ ingressos.length }}
          </span>
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
              :rules="[(v) => !!v || 'Obrigatório']"
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
          <div class="col-12 col-sm-4">
            <q-select
              outlined
              dense
              stack-label
              v-model="ingresso.pessoaUf"
              label="UF"
              :options="ufs"
              emit-value
              map-options
            />
          </div>
          <div class="col-12 col-sm-8">
            <q-input outlined dense stack-label v-model="ingresso.pessoaCidade" label="Cidade" />
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
      <q-btn flat label="Voltar" color="grey-7" @click="$emit('prev')" />
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
  name: "PortalEventosPedidoStepIngressoForm",
  components: {},
  emits: ["prev", "confirmar"],
  setup() {
    const $service = new PedidoService();
    const $pedidoStore = usePedidoStore();

    const data = reactive({
      slide: ref<string | number>(0),
      pedido: computed(() => $pedidoStore.pedido),
      ingressos: computed(() => $pedidoStore.pedido.ingressos ?? []),
      todosIngressosValidos: computed(() =>
        ($pedidoStore.pedido.ingressos ?? []).every((i: any) => i.formDataValido === true),
      ),
      ufs: UFS.map((uf) => ({ label: uf, value: uf })),
    });

    async function editarFormIngresso(ingresso: any) {
      await $service.editarFormIngresso(ingresso);
    }

    function copiarDadosPrimeiroIngresso(ingresso: any) {
      const primeiro = ($pedidoStore.$state.pedido.ingressos ?? [])[0];
      if (!primeiro) return;
      ingresso.pessoaEmail = primeiro.pessoaEmail;
      ingresso.pessoaTelefone = primeiro.pessoaTelefone;
      ingresso.pessoaUf = primeiro.pessoaUf;
      ingresso.pessoaCidade = primeiro.pessoaCidade;
    }

    return {
      ...toRefs(data),
      editarFormIngresso,
      copiarDadosPrimeiroIngresso,
    };
  },
});
</script>

<style scoped></style>
