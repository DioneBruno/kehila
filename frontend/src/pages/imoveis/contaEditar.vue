<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-lg">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="grey-7"
        :to="{ name: 'imoveis.contas' }"
        class="q-mr-sm"
      />
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ conta ? labelConta(conta) : "Carregando..." }}
        </p>
        <div v-if="conta" class="q-mt-xs">
          <q-badge
            :color="corContaSituacao(conta.situacao)"
            :label="labelContaSituacao(conta.situacao)"
            class="q-mr-xs"
          />
          <span class="text-caption text-grey-7">
            {{ labelContaTipo(conta.tipo) }} · vence em {{ formatarData(conta.vencimento) }} ·
            {{ formatarMoeda(conta.valor) }}
          </span>
        </div>
      </div>
      <div v-if="conta" class="col-auto row q-gutter-sm">
        <q-btn
          v-if="conta.situacao !== 'paga'"
          unelevated
          no-caps
          color="positive"
          icon="paid"
          label="Pagar"
          @click="dialogoPagamento = true"
        />
        <q-btn
          v-else
          outline
          no-caps
          color="grey-8"
          icon="undo"
          label="Desfazer pagamento"
          @click="desfazerPagamento"
        />
        <q-btn
          v-if="ehAdmin"
          unelevated
          color="negative"
          label="Excluir"
          icon="delete"
          @click="excluir"
        />
      </div>
    </div>

    <div v-if="naoEncontrado" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="receipt_long" size="48px" />
      <p class="q-mt-md">Conta não encontrada.</p>
      <q-btn flat color="primary" label="Voltar para a lista" :to="{ name: 'imoveis.contas' }" />
    </div>

    <div v-if="conta" class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-form ref="formRef" greedy @submit.prevent="salvar">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <p class="text-subtitle1 text-weight-bold q-ma-none">Dados da conta</p>
                <q-btn
                  v-if="!editando"
                  flat
                  dense
                  icon="edit"
                  label="Editar"
                  color="primary"
                  @click="editando = true"
                />
                <div v-else class="row q-gutter-sm">
                  <q-btn flat dense label="Cancelar" color="grey-7" @click="cancelarEdicao" />
                  <q-btn
                    unelevated
                    dense
                    type="submit"
                    label="Salvar"
                    color="primary"
                    icon="save"
                  />
                </div>
              </div>
              <conta-form :form="form" :readonly="!editando" edicao />
            </q-card-section>
          </q-card>
        </q-form>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Pagamento</p>
            <p v-if="conta.situacao !== 'paga'" class="text-grey-6 q-ma-none">Ainda não paga.</p>
            <q-list v-else dense>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Pago em</q-item-label>
                  <q-item-label>{{ formatarData(conta.pagoEm) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Valor pago</q-item-label>
                  <q-item-label>{{ formatarMoeda(conta.valorPago) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Ligações</p>
            <q-list dense>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Proprietário</q-item-label>
                  <q-item-label>{{ conta.proprietarioNome }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="conta.imovelUuid">
                <q-item-section>
                  <q-item-label caption>Imóvel</q-item-label>
                  <q-item-label>
                    <router-link
                      class="text-primary"
                      :to="{ name: 'imoveis.imoveis.detalhe', params: { uuid: conta.imovelUuid } }"
                    >
                      {{ conta.imovelIdentificacao }}
                    </router-link>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="conta.contratoUuid">
                <q-item-section>
                  <q-item-label caption>Contrato</q-item-label>
                  <q-item-label>
                    <router-link
                      class="text-primary"
                      :to="{
                        name: 'imoveis.contratos.detalhe',
                        params: { uuid: conta.contratoUuid },
                      }"
                    >
                      {{ conta.contratoNumero ? `Nº ${conta.contratoNumero}` : "Ver contrato" }}
                    </router-link>
                    <span v-if="conta.inquilinoNome"> · {{ conta.inquilinoNome }}</span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <q-card v-if="conta.parcelas.length > 1" flat bordered>
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Outras parcelas</p>
            <q-list dense separator>
              <q-item
                v-for="p in conta.parcelas.filter((x) => x.uuid !== conta!.uuid)"
                :key="p.uuid"
                clickable
                :to="{ name: 'imoveis.contas.detalhe', params: { uuid: p.uuid } }"
              >
                <q-item-section>
                  <q-item-label>
                    Parcela {{ p.parcelaNumero }}/{{ conta.parcelaTotal }}
                  </q-item-label>
                  <q-item-label caption>{{ formatarData(p.vencimento) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="corContaSituacao(p.situacao)"
                    :label="labelContaSituacao(p.situacao)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Anexos</p>
            <p v-if="!conta.anexos.length" class="text-grey-6">Nenhum anexo.</p>
            <q-list v-else separator class="q-mb-md">
              <q-item v-for="a in conta.anexos" :key="a.uuid">
                <q-item-section avatar>
                  <q-icon
                    :name="a.contentType === 'application/pdf' ? 'picture_as_pdf' : 'image'"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ a.nomeArquivo }}</q-item-label>
                  <q-item-label caption>
                    {{ labelAnexoTipo(a.tipo) }} · {{ formatarTamanho(a.tamanho) }} ·
                    {{ formatarDataHora(a.createdAt) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row q-gutter-xs">
                    <q-btn
                      flat
                      dense
                      round
                      icon="open_in_new"
                      color="primary"
                      @click="abrirAnexo(a.uuid)"
                    >
                      <q-tooltip>Abrir</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      icon="delete"
                      color="negative"
                      @click="removerAnexo(a.uuid)"
                    >
                      <q-tooltip>Remover</q-tooltip>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <div class="row q-col-gutter-sm items-start">
              <div class="col-12 col-md-5">
                <q-file
                  v-model="arquivo"
                  label="Arquivo (PDF, PNG ou JPG)"
                  filled
                  dense
                  clearable
                  accept=".pdf,.png,.jpg,.jpeg"
                  :max-file-size="10 * 1024 * 1024"
                  @rejected="arquivoRejeitado"
                >
                  <template v-slot:prepend><q-icon name="attach_file" /></template>
                </q-file>
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="tipoAnexo"
                  label="Tipo"
                  filled
                  dense
                  emit-value
                  map-options
                  :options="tiposAnexo"
                />
              </div>
              <div class="col-12 col-md-3">
                <q-btn
                  unelevated
                  no-caps
                  color="primary"
                  icon="upload"
                  label="Enviar"
                  :disable="!arquivo"
                  @click="enviarAnexo"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <conta-pagamento-dialog
      v-if="conta"
      v-model="dialogoPagamento"
      :conta="conta"
      @pago="carregar"
    />
  </q-page>
</template>

<script lang="ts">
import { useQuasar } from "quasar";
import { computed, defineComponent, onMounted, reactive, ref, toRefs, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ContaAnexoTipo, ContaDetalhe } from "src/@modules/imoveis/conta.http";
import TokenDecode from "src/@modules/auth/tokenDecode";
import ContaForm, { contaFormParaEdicao, novoContaForm } from "./contaForm.vue";
import ContaPagamentoDialog from "./contaPagamentoDialog.vue";
import {
  ImoveisService,
  corContaSituacao,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  labelConta,
  labelContaSituacao,
  labelContaTipo,
} from "./imoveis.service";

const TIPOS_ANEXO: { value: ContaAnexoTipo; label: string }[] = [
  { value: "documento", label: "Documento" },
  { value: "comprovante", label: "Comprovante" },
];

export default defineComponent({
  name: "ContaEditar",
  components: { ContaForm, ContaPagamentoDialog },
  setup() {
    const $q = useQuasar();
    const $route = useRoute();
    const $router = useRouter();
    const $service = new ImoveisService();
    const uuid = computed(() => $route.params.uuid as string);
    // O DELETE do backend é só para admin.
    const ehAdmin = TokenDecode.execute()?.user?.position === "admin";

    const data = reactive({
      conta: null as ContaDetalhe | null,
      naoEncontrado: false,
      editando: false,
      dialogoPagamento: false,
      arquivo: null as File | null,
      tipoAnexo: "documento" as ContaAnexoTipo,
    });
    const form = reactive(novoContaForm());
    const formRef = ref();

    async function carregar() {
      const conta = await $service.buscarConta(uuid.value);
      data.conta = conta;
      data.naoEncontrado = !conta;
      Object.assign(form, novoContaForm(conta));
    }

    async function salvar() {
      if (await $service.alterarConta(uuid.value, contaFormParaEdicao(form))) {
        data.editando = false;
        await carregar();
      }
    }

    function cancelarEdicao() {
      data.editando = false;
      Object.assign(form, novoContaForm(data.conta));
      formRef.value?.resetValidation();
    }

    async function desfazerPagamento() {
      if (!(await $service.confirmar("Desfazer o pagamento desta conta?"))) return;
      if (await $service.desfazerPagamentoConta(uuid.value)) await carregar();
    }

    async function excluir() {
      if (await $service.deletarConta(uuid.value)) {
        await $router.push({ name: "imoveis.contas" });
      }
    }

    async function enviarAnexo() {
      if (!data.arquivo) return;
      if (await $service.enviarAnexoConta(uuid.value, data.arquivo, data.tipoAnexo)) {
        data.arquivo = null;
        await carregar();
      }
    }

    function arquivoRejeitado() {
      $q.notify({
        type: "negative",
        message: "Arquivo inválido. Use PDF, PNG ou JPG de até 10 MB",
      });
    }

    async function abrirAnexo(anexoUuid: string) {
      // Abre a aba antes do await para o navegador não bloquear o pop-up.
      const aba = window.open("", "_blank");
      const r = await $service.urlAnexoConta(uuid.value, anexoUuid);
      if (r && aba) aba.location.href = r.url;
      else aba?.close();
    }

    async function removerAnexo(anexoUuid: string) {
      if (await $service.removerAnexoConta(uuid.value, anexoUuid)) await carregar();
    }

    function formatarTamanho(bytes: number) {
      return bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    const labelAnexoTipo = (t: ContaAnexoTipo) =>
      TIPOS_ANEXO.find((o) => o.value === t)?.label ?? t;

    // Navegar entre parcelas reaproveita o componente.
    watch(uuid, (novo) => {
      if (!novo) return;
      data.editando = false;
      void carregar();
    });
    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      form,
      formRef,
      ehAdmin,
      tiposAnexo: TIPOS_ANEXO,
      carregar,
      salvar,
      cancelarEdicao,
      desfazerPagamento,
      excluir,
      enviarAnexo,
      arquivoRejeitado,
      abrirAnexo,
      removerAnexo,
      formatarTamanho,
      labelAnexoTipo,
      labelConta,
      labelContaTipo,
      labelContaSituacao,
      corContaSituacao,
      formatarData,
      formatarDataHora,
      formatarMoeda,
    };
  },
});
</script>
