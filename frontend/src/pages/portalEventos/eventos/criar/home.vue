<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round dense icon="arrow_back" color="grey-7" :to="{ name: 'eventos' }" class="q-mr-sm" />
      <div>
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Novo Evento</p>
        <p class="text-caption text-grey-6 q-ma-none">Preencha os dados do evento</p>
      </div>
    </div>

    <q-form @submit.prevent="salvar" greedy>
      <div class="row q-col-gutter-md">
        <!-- Informações Básicas -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-md">Informações Básicas</p>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="form.titulo"
                    label="Título do Evento *"
                    filled
                    :rules="[(v) => !!v || 'O título é obrigatório']"
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
                    hint="Descreva o evento para os participantes"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Datas -->
        <div class="col-12 col-md-6">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-md">Data e Horário</p>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="form.dataInicio"
                    label="Início do Evento *"
                    filled
                    readonly
                    :rules="[(v) => !!v || 'A data de início é obrigatória']"
                    lazy-rules
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="form.dataInicio" mask="YYYY-MM-DDTHH:mm" color="primary">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="OK" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                      <q-icon name="schedule" class="cursor-pointer q-ml-xs">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-time v-model="form.dataInicio" mask="YYYY-MM-DDTHH:mm" color="primary" format24h>
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="OK" color="primary" flat />
                            </div>
                          </q-time>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
                <div class="col-12">
                  <q-input
                    v-model="form.dataFim"
                    label="Fim do Evento"
                    filled
                    readonly
                    clearable
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="form.dataFim" mask="YYYY-MM-DDTHH:mm" color="primary">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="OK" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                      <q-icon name="schedule" class="cursor-pointer q-ml-xs">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-time v-model="form.dataFim" mask="YYYY-MM-DDTHH:mm" color="primary" format24h>
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="OK" color="primary" flat />
                            </div>
                          </q-time>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
                <div class="col-12">
                  <q-input
                    v-model.number="form.capacidadeTotal"
                    label="Capacidade Total"
                    filled
                    type="number"
                    min="1"
                    hint="Deixe em branco para ilimitado"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Local -->
        <div class="col-12 col-md-6">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <p class="text-subtitle1 text-weight-bold q-ma-none">Local</p>
                <q-toggle v-model="form.online" label="Evento Online" color="primary" />
              </div>

              <div v-if="!form.online" class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input v-model="form.localNome" label="Nome do Local" filled />
                </div>
                <div class="col-12">
                  <q-input v-model="form.localEndereco" label="Endereço" filled />
                </div>
              </div>

              <div v-else class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="form.linkOnline"
                    label="Link do Evento *"
                    filled
                    :rules="[
                      (v) => !form.online || !!v || 'O link é obrigatório para eventos online',
                    ]"
                    lazy-rules
                    hint="Ex: link do Zoom, Meet, YouTube..."
                  >
                    <template v-slot:prepend>
                      <q-icon name="link" />
                    </template>
                  </q-input>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Ações -->
        <div class="col-12">
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancelar" color="grey-7" :to="{ name: 'eventos' }" />
            <q-btn unelevated type="submit" label="Criar Evento" color="primary" icon="save" />
          </div>
        </div>
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue";
import { EventosService } from "../eventos.service";

export default defineComponent({
  name: "PortalEventosEventosCriar",
  setup() {
    const $service = new EventosService();

    const data = reactive({
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
        bannerUrl: "",
      },
    });

    async function salvar() {
      const payload = {
        titulo: data.form.titulo,
        descricao: data.form.descricao || undefined,
        dataInicio: data.form.dataInicio,
        dataFim: data.form.dataFim || undefined,
        capacidadeTotal: data.form.capacidadeTotal || undefined,
        online: data.form.online,
        localNome: data.form.online ? undefined : data.form.localNome || undefined,
        localEndereco: data.form.online ? undefined : data.form.localEndereco || undefined,
        linkOnline: data.form.online ? data.form.linkOnline : undefined,
      };
      await $service.criar(payload);
    }

    return {
      ...toRefs(data),
      salvar,
    };
  },
});
</script>
