<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="grey-7"
        :to="{ name: 'eventos' }"
        class="q-mr-sm"
      />
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ evento?.titulo || "Carregando..." }}
        </p>
        <div class="row items-center q-gutter-xs q-mt-xs">
          <q-badge
            v-if="evento"
            :color="statusCor(evento.status)"
            :label="statusLabel(evento.status)"
          />
          <q-badge v-if="evento?.online" color="blue" icon="videocam" label="Online" />
        </div>
      </div>
      <!-- Ações de status -->
      <div v-if="evento" class="col-auto row q-gutter-sm">
        <q-btn
          v-if="evento.status === 'rascunho'"
          unelevated
          color="primary"
          label="Publicar"
          icon="publish"
          @click="publicar"
        />
        <q-btn
          v-if="['rascunho', 'publicado', 'em_vendas'].includes(evento.status)"
          unelevated
          color="negative"
          label="Cancelar"
          icon="cancel"
          @click="cancelar"
        />
        <q-btn
          v-if="['em_vendas', 'publicado'].includes(evento.status)"
          unelevated
          color="grey-7"
          label="Encerrar"
          icon="stop"
          @click="encerrar"
        />
      </div>
    </div>

    <div v-if="evento" class="row q-col-gutter-md">
      <!-- Formulário de edição -->
      <div class="col-12 col-md-8">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <p class="text-subtitle1 text-weight-bold q-ma-none">Dados do Evento</p>
              <div>
                <q-btn
                  v-if="!editando"
                  flat
                  dense
                  icon="edit"
                  label="Editar"
                  color="primary"
                  :disable="!podeEditar"
                  @click="editando = true"
                />
                <div v-else class="row q-gutter-sm">
                  <q-btn flat dense label="Cancelar" color="grey-7" @click="cancelarEdicao" />
                  <q-btn
                    unelevated
                    dense
                    label="Salvar"
                    color="primary"
                    icon="save"
                    @click="salvar"
                  />
                </div>
              </div>
            </div>

            <q-form greedy>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="form.titulo"
                    label="Título"
                    filled
                    :readonly="!editando"
                    :rules="[(v) => !!v || 'Obrigatório']"
                    lazy-rules
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="form.descricao"
                    label="Descrição"
                    filled
                    type="textarea"
                    autogrow
                    :readonly="!editando"
                  />
                </div>

                <!-- Data início -->
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.dataInicio"
                    label="Data de Início"
                    filled
                    :readonly="!editando"
                  >
                    <template v-if="editando" v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover>
                          <q-date v-model="form.dataInicio" mask="YYYY-MM-DDTHH:mm" color="primary">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="OK" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                      <q-icon name="schedule" class="cursor-pointer q-ml-xs">
                        <q-popup-proxy cover>
                          <q-time
                            v-model="form.dataInicio"
                            mask="YYYY-MM-DDTHH:mm"
                            color="primary"
                            format24h
                          >
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="OK" color="primary" flat />
                            </div>
                          </q-time>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>

                <!-- Data fim -->
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.dataFim"
                    label="Data de Fim"
                    filled
                    :readonly="!editando"
                    clearable
                  >
                    <template v-if="editando" v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover>
                          <q-date v-model="form.dataFim" mask="YYYY-MM-DDTHH:mm" color="primary">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="OK" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                      <q-icon name="schedule" class="cursor-pointer q-ml-xs">
                        <q-popup-proxy cover>
                          <q-time
                            v-model="form.dataFim"
                            mask="YYYY-MM-DDTHH:mm"
                            color="primary"
                            format24h
                          >
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="OK" color="primary" flat />
                            </div>
                          </q-time>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>

                <div class="col-12 col-sm-6">
                  <q-input
                    v-model.number="form.capacidadeTotal"
                    label="Capacidade Total"
                    filled
                    type="number"
                    :readonly="!editando"
                  />
                </div>

                <!-- Local / Online -->
                <div class="col-12">
                  <q-toggle
                    v-model="form.online"
                    label="Evento Online"
                    color="primary"
                    :disable="!editando"
                  />
                </div>

                <template v-if="!form.online">
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="form.localNome"
                      label="Nome do Local"
                      filled
                      :readonly="!editando"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="form.localEndereco"
                      label="Endereço"
                      filled
                      :readonly="!editando"
                    />
                  </div>
                </template>

                <div v-else class="col-12">
                  <q-input
                    v-model="form.linkOnline"
                    label="Link do Evento"
                    filled
                    :readonly="!editando"
                  >
                    <template v-slot:prepend><q-icon name="link" /></template>
                  </q-input>
                </div>
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Painel lateral: resumo -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-md">Resumo</p>
            <q-list dense>
              <q-item>
                <q-item-section avatar
                  ><q-icon name="calendar_today" color="grey-6"
                /></q-item-section>
                <q-item-section>
                  <q-item-label caption>Criado em</q-item-label>
                  <q-item-label>{{ formatarData(evento.createdAt) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="evento.capacidadeTotal">
                <q-item-section avatar><q-icon name="group" color="grey-6" /></q-item-section>
                <q-item-section>
                  <q-item-label caption>Capacidade</q-item-label>
                  <q-item-label>{{ evento.capacidadeTotal }} pessoas</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar><q-icon name="tag" color="grey-6" /></q-item-section>
                <q-item-section>
                  <q-item-label caption>Slug</q-item-label>
                  <q-item-label class="text-caption text-grey-7">{{ evento.slug }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar><q-icon name="public" color="grey-6" /></q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    dense
                    no-caps
                    size="12px"
                    color="primary"
                    icon="open_in_new"
                    label="Abrir"
                    @click="abrirPaginaPublica()"
                  />
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    dense
                    no-caps
                    size="12px"
                    color="primary"
                    icon="copy_all"
                    label="Copiar link"
                    @click="copiarLink()"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Lotes -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <p class="text-subtitle1 text-weight-bold q-ma-none">Lotes</p>
              <q-btn
                flat
                dense
                size="sm"
                icon="open_in_new"
                label="Gerenciar"
                color="primary"
                :to="{ name: 'eventos.lotes', params: { uuid: evento.uuid } }"
              />
            </div>
            <div v-if="lotes.length === 0" class="text-center text-grey-5 q-py-sm">
              <q-icon name="confirmation_number" size="md" />
              <p class="q-ma-none text-caption q-mt-xs">Nenhum lote cadastrado</p>
            </div>
            <q-list v-else dense separator>
              <q-item v-for="lote in lotes" :key="lote.uuid" class="q-pa-none q-py-xs">
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ lote.nome }}</q-item-label>
                  <q-item-label caption>
                    {{ lote.quantidade }} ingresso{{ lote.quantidade !== 1 ? "s" : "" }} &middot;
                    {{ formatarMoeda(lote.preco) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="lote.ativo ? 'positive' : 'grey-5'"
                    :label="lote.ativo ? 'Ativo' : 'Inativo'"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs } from "vue";
import { useRoute, useRouter } from "vue-router";
import { EventoService, STATUS_CORES, STATUS_LABELS } from "./evento.service";
import { LotesService } from "./lotes.service";
import { useQuasar } from "quasar";

export default defineComponent({
  name: "PortalEventosEventosDetalhe",
  setup() {
    const $route = useRoute();
    const $router = useRouter();
    const $q = useQuasar();
    const $service = new EventoService();
    const $lotesService = new LotesService();

    const data = reactive({
      evento: null as any,
      lotes: [] as any[],
      editando: false,
      form: {
        titulo: "",
        descricao: "",
        dataInicio: "",
        dataFim: "",
        capacidadeTotal: null as number | null,
        online: false,
        localNome: "",
        localEndereco: "",
        linkOnline: "",
      },
    });

    const podeEditar = computed(() => ["rascunho", "publicado"].includes(data.evento?.status));

    function carregarForm(evento: any) {
      data.form.titulo = evento.titulo;
      data.form.descricao = evento.descricao ?? "";
      data.form.dataInicio = evento.dataInicio ? evento.dataInicio.slice(0, 16) : "";
      data.form.dataFim = evento.dataFim ? evento.dataFim.slice(0, 16) : "";
      data.form.capacidadeTotal = evento.capacidadeTotal ?? null;
      data.form.online = evento.online;
      data.form.localNome = evento.localNome ?? "";
      data.form.localEndereco = evento.localEndereco ?? "";
      data.form.linkOnline = evento.linkOnline ?? "";
    }

    async function carregar() {
      const uuid = $route.params.uuid as string;
      const [evento, lotes] = await Promise.all([
        $service.buscarPorUuid(uuid),
        $lotesService.listar(uuid),
      ]);
      if (evento) {
        data.evento = evento;
        carregarForm(evento);
      }
      data.lotes = lotes;
    }

    async function salvar() {
      const uuid = $route.params.uuid as string;
      const ok = await $service.editar(uuid, {
        titulo: data.form.titulo,
        descricao: data.form.descricao || undefined,
        dataInicio: data.form.dataInicio,
        dataFim: data.form.dataFim || undefined,
        capacidadeTotal: data.form.capacidadeTotal || undefined,
        online: data.form.online,
        localNome: data.form.online ? undefined : data.form.localNome || undefined,
        localEndereco: data.form.online ? undefined : data.form.localEndereco || undefined,
        linkOnline: data.form.online ? data.form.linkOnline : undefined,
      });
      if (ok) {
        data.editando = false;
        await carregar();
      }
    }

    function cancelarEdicao() {
      data.editando = false;
      if (data.evento) carregarForm(data.evento);
    }

    async function publicar() {
      const uuid = $route.params.uuid as string;
      const ok = await $service.publicar(uuid);
      if (ok) await carregar();
    }

    async function cancelar() {
      const uuid = $route.params.uuid as string;
      const ok = await $service.cancelar(uuid);
      if (ok) await carregar();
    }

    async function encerrar() {
      const uuid = $route.params.uuid as string;
      const ok = await $service.encerrar(uuid);
      if (ok) await carregar();
    }

    function statusLabel(status: string) {
      return STATUS_LABELS[status] ?? status;
    }

    function statusCor(status: string) {
      return STATUS_CORES[status] ?? "grey";
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

    function formatarMoeda(valor: number) {
      return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function abrirPaginaPublica() {
      const url = montaLinkPublico();
      window.open(url, "_blank");
    }

    function copiarLink() {
      const url = montaLinkPublico();
      navigator.clipboard.writeText(url);
      $q.notify({ message: "Link copiado!", color: "positive" });
    }

    function montaLinkPublico(): string {
      const urlOrigin = window.location.origin;
      const url = $router.resolve({
        name: "eventos.publico",
        params: { eventoUuid: data.evento.uuid },
      });
      return `${urlOrigin}${url.href}`;
    }

    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      podeEditar,
      copiarLink,
      abrirPaginaPublica,
      salvar,
      cancelarEdicao,
      publicar,
      cancelar,
      encerrar,
      statusLabel,
      statusCor,
      formatarData,
      formatarMoeda,
    };
  },
});
</script>
