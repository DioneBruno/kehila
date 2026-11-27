<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Agenda</p>
        <p class="text-caption text-grey-6 q-ma-none">Contas a pagar por faixa de vencimento</p>
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-col-gutter-sm">
        <div class="col-12 col-sm-4">
          <q-select
            v-model="filtro.proprietarioUuid"
            label="Proprietário"
            dense
            outlined
            clearable
            use-input
            input-debounce="300"
            emit-value
            map-options
            :options="proprietarios.opcoes.value"
            @filter="proprietarios.filtrar"
          />
        </div>
        <div class="col-12 col-sm-4">
          <q-select
            v-model="filtro.imovelUuid"
            label="Imóvel"
            dense
            outlined
            clearable
            use-input
            input-debounce="300"
            emit-value
            map-options
            :options="imoveis.opcoes.value"
            @filter="imoveis.filtrar"
          />
        </div>
        <div class="col-12 col-sm-4">
          <q-select
            v-model="filtro.tipo"
            label="Tipo"
            dense
            outlined
            clearable
            emit-value
            map-options
            :options="tipos"
          />
        </div>
      </q-card-section>
    </q-card>

    <div v-if="agenda" class="row q-col-gutter-sm q-mb-md">
      <div v-for="c in cards" :key="c.chave" class="col-12 col-sm-4">
        <q-card
          flat
          bordered
          v-ripple
          class="cursor-pointer text-center"
          :class="{ 'bg-red-1': c.chave === 'vencidas' && c.total > 0 }"
          :style="selecionado === c.chave ? 'outline: 2px solid var(--q-primary)' : undefined"
          @click="selecionado = c.chave"
        >
          <q-card-section class="q-pa-md">
            <div
              class="text-h4 text-weight-bold"
              :class="c.chave === 'vencidas' && c.total > 0 ? 'text-negative' : 'text-primary'"
            >
              {{ c.total }}
            </div>
            <div class="text-caption text-grey-7">{{ c.titulo }}</div>
            <div class="text-subtitle2">{{ formatarMoeda(c.soma) }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card v-if="agenda" flat bordered>
      <q-card-section>
        <p class="text-subtitle1 text-weight-bold q-ma-none">{{ grupoAtual.titulo }}</p>
      </q-card-section>
      <q-separator />
      <p v-if="!grupoAtual.contas.length" class="text-grey-6 q-pa-md q-ma-none">
        Nenhuma conta nesta faixa.
      </p>
      <q-markup-table v-else-if="!modoCartoes" flat square>
        <thead>
          <tr>
            <th class="text-left">Vencimento</th>
            <th class="text-left">Tipo</th>
            <th class="text-left">Categoria</th>
            <th class="text-left">Proprietário</th>
            <th class="text-left">Imóvel</th>
            <th class="text-right">Valor</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in grupoAtual.contas" :key="c.uuid">
            <td>
              {{ formatarData(c.vencimento) }}
              <q-icon v-if="c.situacao === 'vencida'" name="warning" color="negative" size="xs" />
            </td>
            <td>{{ labelContaTipo(c.tipo) }}</td>
            <td>
              <router-link
                class="text-primary"
                :to="{ name: 'imoveis.contas.detalhe', params: { uuid: c.uuid } }"
              >
                {{ labelConta(c) }}
              </router-link>
            </td>
            <td>{{ c.proprietarioNome }}</td>
            <td>{{ c.imovelIdentificacao ?? "-" }}</td>
            <td class="text-right">{{ formatarMoeda(c.valor) }}</td>
            <td class="text-right">
              <q-btn dense unelevated no-caps color="primary" label="Pagar" @click="pagar(c)" />
            </td>
          </tr>
        </tbody>
      </q-markup-table>
      <q-list v-else separator>
        <q-item v-for="c in grupoAtual.contas" :key="c.uuid">
          <q-item-section class="cursor-pointer" @click="abrir(c.uuid)">
            <q-item-label>{{ labelConta(c) }}</q-item-label>
            <q-item-label caption>
              {{ c.imovelIdentificacao ?? c.proprietarioNome }} · vence
              {{ formatarData(c.vencimento) }}
            </q-item-label>
            <q-item-label caption>{{ formatarMoeda(c.valor) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn dense unelevated no-caps color="primary" label="Pagar" @click="pagar(c)" />
          </q-item-section>
        </q-item>
      </q-list>

      <template v-if="grupoAtual.total > grupoAtual.contas.length">
        <q-separator />
        <div class="q-pa-md text-caption">
          Mostrando {{ grupoAtual.contas.length }} de {{ grupoAtual.total }}.
          <router-link class="text-primary" :to="linkContas">Ver todas em Contas</router-link>
        </div>
      </template>
    </q-card>

    <conta-pagamento-dialog
      v-if="contaPagando"
      v-model="dialogo"
      :conta="contaPagando"
      @pago="carregar"
    />
  </q-page>
</template>

<script lang="ts">
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { computed, defineComponent, onMounted, reactive, toRefs, watch } from "vue";
import type {
  AgendaContas,
  Conta,
  ContaSituacao,
  ContaTipo,
} from "src/@modules/imoveis/conta.http";
import { ApiDate } from "src/shared/apiDate.service";
import ContaPagamentoDialog from "./contaPagamentoDialog.vue";
import { criarBusca } from "./contratoForm.vue";
import {
  CONTA_TIPOS,
  ImoveisService,
  formatarData,
  formatarMoeda,
  labelConta,
  labelContaTipo,
} from "./imoveis.service";

type Chave = keyof AgendaContas;

const TITULOS: Record<Chave, string> = {
  vencidas: "Vencidas",
  proximos7: "Próximos 7 dias",
  proximos30: "8–30 dias",
};
const ORDEM: Chave[] = ["vencidas", "proximos7", "proximos30"];

export default defineComponent({
  name: "ImoveisAgenda",
  components: { ContaPagamentoDialog },
  setup() {
    const $q = useQuasar();
    const $router = useRouter();
    const $service = new ImoveisService();
    const modoCartoes = computed(() => $q.screen.lt.md);

    const data = reactive({
      agenda: null as AgendaContas | null,
      selecionado: "proximos7" as Chave,
      dialogo: false,
      contaPagando: null as Conta | null,
    });
    const filtro = reactive({
      proprietarioUuid: null as string | null,
      imovelUuid: null as string | null,
      tipo: null as ContaTipo | null,
    });

    const proprietarios = criarBusca(
      async (busca) => {
        const r = await $service.listarPessoas({
          papel: "proprietario",
          busca: busca || undefined,
          porPagina: 30,
        });
        return (r?.itens ?? []).map((p) => ({ value: p.uuid, label: p.nome }));
      },
      () => null,
    );
    const imoveis = criarBusca(
      async (busca) => {
        const r = await $service.listarImoveis({ busca: busca || undefined, porPagina: 30 });
        return (r?.itens ?? []).map((i) => ({ value: i.uuid, label: i.identificacao }));
      },
      () => null,
    );

    const cards = computed(() =>
      ORDEM.map((chave) => ({
        chave,
        titulo: TITULOS[chave],
        total: data.agenda?.[chave].total ?? 0,
        soma: data.agenda?.[chave].soma ?? 0,
      })),
    );
    const grupoAtual = computed(() => ({
      titulo: TITULOS[data.selecionado],
      total: data.agenda?.[data.selecionado].total ?? 0,
      contas: data.agenda?.[data.selecionado].contas ?? [],
    }));

    /** Tela Contas filtrada pela faixa selecionada e pelos filtros atuais. */
    const linkContas = computed(() => {
      const hojeData = ApiDate.now("YYYY-MM-DD");
      const mais = (n: number) => ApiDate.addDay(hojeData, n, "YYYY-MM-DD");
      const query: Record<string, string> = {};
      const situacao: ContaSituacao = data.selecionado === "vencidas" ? "vencida" : "a_pagar";
      if (data.selecionado === "proximos7") {
        query.vencimentoDe = hojeData;
        query.vencimentoAte = mais(6);
      } else if (data.selecionado === "proximos30") {
        query.vencimentoDe = mais(7);
        query.vencimentoAte = mais(29);
      }
      query.situacao = situacao;
      if (filtro.proprietarioUuid) query.proprietarioUuid = filtro.proprietarioUuid;
      if (filtro.imovelUuid) query.imovelUuid = filtro.imovelUuid;
      if (filtro.tipo) query.tipo = filtro.tipo;
      return { name: "imoveis.contas", query };
    });

    async function carregar(primeira = false) {
      const agenda = await $service.buscarAgendaContas({
        proprietarioUuid: filtro.proprietarioUuid || undefined,
        imovelUuid: filtro.imovelUuid || undefined,
        tipo: filtro.tipo || undefined,
      });
      if (!agenda) return;
      data.agenda = agenda;
      if (primeira) data.selecionado = agenda.vencidas.total > 0 ? "vencidas" : "proximos7";
    }

    function abrir(uuid: string) {
      void $router.push({ name: "imoveis.contas.detalhe", params: { uuid } });
    }

    function pagar(conta: Conta) {
      data.contaPagando = conta;
      data.dialogo = true;
    }

    watch(filtro, () => void carregar());
    onMounted(() => void carregar(true));

    return {
      ...toRefs(data),
      filtro,
      proprietarios,
      imoveis,
      tipos: CONTA_TIPOS,
      cards,
      grupoAtual,
      linkContas,
      modoCartoes,
      carregar: () => carregar(),
      pagar,
      abrir,
      formatarData,
      formatarMoeda,
      labelConta,
      labelContaTipo,
    };
  },
});
</script>
