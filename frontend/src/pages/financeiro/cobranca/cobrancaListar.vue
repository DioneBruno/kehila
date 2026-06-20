<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Cobranças</p>
        <p class="text-caption text-grey-6 q-ma-none">
          Acompanhe as cobranças geradas e os pagamentos de cada uma
        </p>
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-gutter-md items-center">
        <q-input
          v-model="filtros.busca"
          dense
          outlined
          placeholder="Buscar por pagador..."
          clearable
          class="col-12 col-sm-4"
          @update:model-value="buscar"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-select
          v-model="filtros.status"
          dense
          outlined
          clearable
          emit-value
          map-options
          label="Status"
          :options="opcoesStatus"
          class="col-12 col-sm-3"
          @update:model-value="buscar"
        />
      </q-card-section>
    </q-card>

    <!-- Tabela -->
    <q-markup-table flat bordered>
      <thead>
        <tr>
          <th></th>
          <th class="text-left">Pagador</th>
          <th class="text-left">Documento</th>
          <th class="text-right">Valor</th>
          <th class="text-right">Pago</th>
          <th class="text-left">Status</th>
          <th class="text-left">Criado em</th>
          <th class="text-left">Parcelas</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="carregando">
          <tr>
            <td colspan="8" class="text-center text-grey-6 q-py-md">Carregando...</td>
          </tr>
        </template>
        <template v-else-if="cobrancas.length === 0">
          <tr>
            <td colspan="8" class="text-center text-grey-6 q-py-md">
              Nenhuma cobrança encontrada
            </td>
          </tr>
        </template>
        <template v-else>
          <template v-for="cobranca in cobrancas" :key="cobranca.uuid">
            <tr>
              <td>
                <q-btn
                  flat
                  dense
                  round
                  size="sm"
                  :icon="expandido[cobranca.uuid] ? 'expand_less' : 'expand_more'"
                  @click="alternarExpansao(cobranca.uuid)"
                >
                  <q-tooltip>Ver pagamentos</q-tooltip>
                </q-btn>
              </td>
              <td>{{ cobranca.pagadorNome || "-" }}</td>
              <td>{{ cobranca.pagadorDocumento || "-" }}</td>
              <td class="text-right">{{ formatarMoeda(cobranca.valor) }}</td>
              <td class="text-right">{{ formatarMoeda(cobranca.valorPago) }}</td>
              <td>
                <q-badge :color="statusCor(cobranca.status)" :label="statusLabel(cobranca.status)" />
              </td>
              <td>{{ formatarData(cobranca.createdAt) }}</td>
              <td>
                <q-badge
                  color="blue-grey"
                  :label="`${cobranca.pagamentos.length} parcela${cobranca.pagamentos.length !== 1 ? 's' : ''}`"
                />
              </td>
            </tr>
            <tr v-show="expandido[cobranca.uuid]">
              <td colspan="8">
                <div v-if="cobranca.pagamentos.length === 0" class="text-grey-6 text-caption q-py-sm">
                  Nenhum pagamento gerado para esta cobrança
                </div>
                <q-list v-else dense bordered separator class="rounded-borders">
                  <q-item v-for="pagamento in cobranca.pagamentos" :key="pagamento.uuid">
                    <q-item-section>
                      <q-item-label class="row items-center q-gutter-sm">
                        <span class="text-weight-medium text-uppercase">{{
                          pagamento.formaPagamento
                        }}</span>
                        <q-badge
                          :color="statusCor(pagamento.status)"
                          :label="statusLabel(pagamento.status)"
                        />
                      </q-item-label>
                      <q-item-label caption>
                        Vencimento: {{ formatarDataSimples(pagamento.vencimento) }} ·
                        {{ formatarMoeda(pagamento.valor) }}
                        <span v-if="pagamento.pagoEm">
                          · Pago em {{ formatarDataSimples(pagamento.pagoEm) }}</span
                        >
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="row q-gutter-xs">
                        <q-btn
                          v-if="pagamento.linkBoleto"
                          flat
                          dense
                          round
                          size="sm"
                          icon="description"
                          color="primary"
                          :href="pagamento.linkBoleto"
                          target="_blank"
                        >
                          <q-tooltip>Ver boleto</q-tooltip>
                        </q-btn>
                        <q-btn
                          v-if="pagamento.linkCartao"
                          flat
                          dense
                          round
                          size="sm"
                          icon="credit_card"
                          color="primary"
                          :href="pagamento.linkCartao"
                          target="_blank"
                        >
                          <q-tooltip>Link do cartão</q-tooltip>
                        </q-btn>
                        <q-btn
                          v-if="pagamento.pix"
                          flat
                          dense
                          round
                          size="sm"
                          icon="qr_code"
                          color="primary"
                          @click="copiarPix(pagamento.pix)"
                        >
                          <q-tooltip>Copiar código Pix</q-tooltip>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </td>
            </tr>
          </template>
        </template>
      </tbody>
    </q-markup-table>

    <!-- Paginação -->
    <div class="row items-center justify-end q-mt-md q-gutter-md">
      <q-select
        v-model="paginacao.rowsPerPage"
        dense
        outlined
        label="Por página"
        :options="opcoesPorPagina"
        style="width: 120px"
        @update:model-value="alterarPorPagina"
      />
      <q-pagination
        v-model="paginacao.page"
        :max="totalPaginas"
        :max-pages="6"
        boundary-numbers
        @update:model-value="irParaPagina"
      />
    </div>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs } from "vue";
import { Notify } from "quasar";
import { CobrancaService, STATUS_CORES, STATUS_LABELS } from "./cobranca.service";

const OPCOES_STATUS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
const OPCOES_POR_PAGINA = [10, 20, 50];

export default defineComponent({
  name: "FinanceiroCobrancasListar",
  setup() {
    const $service = new CobrancaService();

    const data = reactive({
      carregando: false,
      opcoesStatus: OPCOES_STATUS,
      opcoesPorPagina: OPCOES_POR_PAGINA,
      cobrancas: [] as any[],
      expandido: {} as Record<string, boolean>,
      filtros: {
        busca: "",
        status: null as string | null,
      },
      paginacao: {
        page: 1,
        rowsPerPage: 20,
        rowsNumber: 0,
      },
    });

    const totalPaginas = computed(() =>
      Math.max(1, Math.ceil(data.paginacao.rowsNumber / data.paginacao.rowsPerPage)),
    );

    async function carregar(pagina = 1, porPagina = data.paginacao.rowsPerPage) {
      data.carregando = true;
      const resposta = await $service.listar({
        busca: data.filtros.busca || undefined,
        status: data.filtros.status || undefined,
        pagina,
        porPagina,
      });
      if (resposta) {
        data.cobrancas = resposta.data;
        data.paginacao.rowsNumber = resposta.meta.total;
        data.paginacao.page = pagina;
        data.paginacao.rowsPerPage = porPagina;
      }
      data.carregando = false;
    }

    function buscar() {
      void carregar(1, data.paginacao.rowsPerPage);
    }

    function irParaPagina(pagina: number) {
      void carregar(pagina, data.paginacao.rowsPerPage);
    }

    function alterarPorPagina(porPagina: number) {
      void carregar(1, porPagina);
    }

    function alternarExpansao(uuid: string) {
      data.expandido[uuid] = !data.expandido[uuid];
    }

    function statusLabel(status: string) {
      return STATUS_LABELS[status] ?? status;
    }

    function statusCor(status: string) {
      return STATUS_CORES[status] ?? "grey";
    }

    function formatarMoeda(valor: number) {
      return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function formatarData(iso: string) {
      if (!iso) return "-";
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    function formatarDataSimples(data: string | null) {
      if (!data) return "-";
      return new Date(data).toLocaleDateString("pt-BR");
    }

    function copiarPix(codigo: string) {
      void navigator.clipboard.writeText(codigo);
      Notify.create({ type: "positive", message: "Código Pix copiado", position: "top" });
    }

    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      totalPaginas,
      irParaPagina,
      alterarPorPagina,
      alternarExpansao,
      buscar,
      statusLabel,
      statusCor,
      formatarMoeda,
      formatarData,
      formatarDataSimples,
      copiarPix,
    };
  },
});
</script>
