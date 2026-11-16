<template>
  <q-page padding>
    <div class="row q-col-gutter-md bi-layout">
      <div class="col-12 col-md-4 col-lg-3 column no-wrap bi-lista">
        <div>
          <q-card flat bordered>
            <q-card-section class="row q-pa-xs">
              <div class="col">
                <q-input
                  dense
                  outlined
                  stack-label
                  v-model="filtros.pesquisa"
                  label="Pesquisar"
                  type="text"
                  @keyup.enter="filter()"
                  hint="Enter para pesquisar"
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col-auto q-pl-xs">
                <q-btn-dropdown v-if="admin" flat dense color="grey-9" dropdown-icon="more_vert">
                  <q-list>
                    <q-item clickable v-close-popup v-ripple @click="newBi()">
                      <q-item-section side>
                        <q-icon color="primary" name="add" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Incluir</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <q-scroll-area class="col q-mt-sm bi-lista__scroll">
          <q-card flat bordered class="my-card">
            <q-list bordered separator>
              <q-item clickable v-ripple v-for="item in biList" :key="item.uuid">
                <q-item-section avatar>
                  <q-icon
                    v-if="item.referencia.tipo === 'dashboard'"
                    color="grey-8"
                    name="dashboard"
                  />
                  <q-icon v-else color="grey-8" name="list" />
                </q-item-section>
                <q-item-section @click="montar(item)">
                  <q-item-label> {{ item.titulo }} </q-item-label>
                  <q-item-label caption lines="2" class="text-grey-7">
                    {{ item.descricao }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div>
                    <q-btn v-if="item.descricao" flat dense size="sm" color="grey-6" icon="info">
                      <q-popup-proxy>
                        <q-banner>
                          <div class="text-h6 text-grey-9">
                            {{ item.titulo }}
                          </div>
                          <div class="text-grey-8">
                            {{ item.descricao }}
                          </div>
                        </q-banner>
                      </q-popup-proxy>
                    </q-btn>
                    <q-btn-dropdown
                      v-if="admin"
                      flat
                      dense
                      size="sm"
                      color="grey-9"
                      dropdown-icon="more_vert"
                    >
                      <q-list>
                        <q-item clickable v-close-popup v-ripple @click="editBi(item)">
                          <q-item-section side>
                            <q-icon dense size="sm" color="primary" name="edit" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>Editar</q-item-label>
                          </q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup v-ripple @click="deleteBi(item)">
                          <q-item-section side>
                            <q-icon dense size="sm" color="negative" name="delete" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>Excluir</q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </q-scroll-area>
      </div>
      <div class="col-12 col-md-8 col-lg-9 bi-viewer">
        <q-card flat bordered class="fit column">
          <div v-if="!metabaseUrl" class="col flex flex-center column text-grey-6 q-pa-lg text-center">
            <q-icon name="insights" size="48px" class="q-mb-sm" />
            <span class="text-subtitle1">Selecione um Dashboard ou Relatório</span>
          </div>
          <iframe v-else :src="metabaseUrl" frameborder="0" class="col" width="100%" />
        </q-card>
      </div>
    </div>

    <!-- Configurações do Relatório -->
    <q-dialog v-model="openModal" persistent>
      <q-card style="width: 500px; max-width: 100%">
        <q-card-section class="row items-center">
          <span class="q-ml-sm text-h6">Novo BI</span>
          <q-space />
          <q-btn flat dense color="grey-9" icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-select
                outlined
                dense
                stack-label
                hide-dropdown-icon
                map-options
                emit-value
                v-model="bi.gateway"
                :options="gateways"
                label="Gateway"
              />
            </div>
            <div class="col-12 row q-col-gutter-md">
              <div class="col-6">
                <q-select
                  outlined
                  dense
                  stack-label
                  map-options
                  emit-value
                  :options="[
                    { label: 'Dashboard', value: 'dashboard' },
                    { label: 'Questão', value: 'question' },
                  ]"
                  v-model="bi.referencia.tipo"
                  type="text"
                  label="Tipo"
                />
              </div>
              <div class="col-6">
                <q-input
                  outlined
                  dense
                  stack-label
                  v-model="bi.referencia.valor"
                  type="text"
                  label="Referência"
                />
              </div>
            </div>
            <div class="col-12">
              <q-input outlined dense stack-label v-model="bi.titulo" type="text" label="Título" />
            </div>
            <div class="col-12">
              <q-input
                outlined
                dense
                stack-label
                v-model="bi.descricao"
                type="textarea"
                label="Descrição"
              />
            </div>
            <div class="col-12">
              <q-select
                outlined
                stack-label
                map-options
                emit-value
                multiple
                use-chips
                hide-dropdown-icon
                v-model="bi.roles"
                :options="roles"
                label="Papéis"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" color="grey-9" v-close-popup />
          <q-btn flat no-caps label="Salvar" color="primary" @click="save()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref, toRefs } from "vue";
// import { MessageConfirmationService } from "src/shared/messageConfirmation.service";
import { useQuasar } from "quasar";
import { computed } from "vue";
// import { useAuthMeStore } from "src/stores/auth/me";
import { BiService } from "./bi.service";

const runtimeEnv = (window as any).__env ?? {};
const metabaseBaseUrl = runtimeEnv.METABASE_URL || process.env.METABASE_URL;

export default defineComponent({
  name: "BiHome",
  setup() {
    // const $authMeStore = useAuthMeStore();
    const $q = useQuasar();
    // const $confirmation = new MessageConfirmationService();
    const $service = new BiService();

    const data = reactive({
      metabaseBaseUrl,
      me: {},
      admin: true,
      filtros: ref({ pesquisa: "" }),
      openModal: ref(false),
      gateways: ref([{ label: "Metabase", value: "metabase" }]),
      bi: ref({ roles: [] } as any),
      biList: ref([] as any[]),
      metabaseUrl: ref(""),
      roles: ref([] as any[]),
    });

    onMounted(() => {
      if (!metabaseBaseUrl) console.error("Metabase URL não configurado no env");
      filter();
      resetBi();
      // Define config global
      (window as any).metabaseConfig = {
        theme: {
          preset: "light",
        },
        isGuest: true,
        instanceUrl: metabaseBaseUrl,
      };

      // Cria script dinamicamente
      const script = document.createElement("script");
      script.src = `${metabaseBaseUrl}/app/embed.js`;
      script.defer = true;

      document.body.appendChild(script);
      getRoles();
    });

    function newBi() {
      resetBi();
      data.openModal = true;
    }

    function resetBi() {
      data.bi = {
        gateway: "",
        referencia: { tipo: "", valor: "" },
        titulo: "",
        descricao: "",
        roles: [],
      };
    }

    async function filter() {
      const response = await $service.list(data.filtros);
      data.biList = response.data;
    }

    async function save() {
      await $service.save(data.bi);
      data.openModal = false;
      filter();
    }

    function editBi(item: any) {
      data.bi = item;
      data.openModal = true;
    }

    async function deleteBi(item: any) {
      // const confirm = await $confirmation.execute("Deseja realmente excluir?");
      // if (!confirm) return;
      await $service.delete(item.uuid);
      filter();
    }

    async function montar(item: any) {
      try {
        $q.loading.show();
        const response = await $service.montar(item.uuid);
        data.metabaseUrl = `${metabaseBaseUrl}/embed/${item.referencia.tipo}/${response}#bordered=true&titled=true`;
        // No celular/tablet o painel fica abaixo da lista: rola até ele.
        if (window.innerWidth < 1024) {
          setTimeout(() => document.querySelector(".bi-viewer")?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      } catch (error) {
      } finally {
        $q.loading.hide();
      }
    }

    async function getRoles() {
      const response = await $service.getRoles();
      data.roles = response.map((role) => {
        return { label: role.title, value: role.nameRoles };
      });
    }

    return {
      ...toRefs(data),
      newBi,
      save,
      filter,
      editBi,
      deleteBi,
      montar,
    };
  },
});
</script>

<style scoped>
/* Desktop: lista e painel lado a lado ocupando a altura da tela */
.bi-layout {
  min-height: calc(100vh - 56px - 2 * var(--app-gutter));
}

.bi-lista,
.bi-viewer {
  height: calc(100vh - 56px - 2 * var(--app-gutter));
}

.bi-lista__scroll {
  min-height: 0;
}

.bi-viewer iframe {
  border: 0;
  border-radius: var(--app-radius);
}

/* Celular/tablet: empilhados */
@media (max-width: 1023.98px) {
  .bi-lista {
    height: auto;
  }

  .bi-lista__scroll {
    flex: none;
    height: 40vh;
  }

  .bi-viewer {
    height: 75vh;
  }
}
</style>
