<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center page-header q-mb-lg">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="grey-7"
        :to="{ name: 'membros' }"
        class="q-mr-sm"
      />
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ membro?.nome || (membro ? "Sem nome" : "Carregando...") }}
        </p>
        <div v-if="membro" class="q-mt-xs">
          <q-badge
            :color="membro.ativo ? 'positive' : 'grey-6'"
            :label="membro.ativo ? 'Ativo' : 'Inativo'"
            class="q-mr-xs"
          />
          <q-badge v-if="membro.membro" color="primary" label="Membro" />
        </div>
      </div>
      <div v-if="membro" class="col-auto">
        <q-btn unelevated color="negative" label="Excluir" icon="delete" @click="excluir" />
      </div>
    </div>

    <div v-if="naoEncontrado" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="person_off" size="48px" />
      <p class="q-mt-md">Membro não encontrado.</p>
      <q-btn flat color="primary" label="Voltar para a lista" :to="{ name: 'membros' }" />
    </div>

    <div v-if="membro" class="row q-col-gutter-md">
      <!-- Formulário -->
      <div class="col-12 col-md-8">
        <q-form ref="formRef" greedy @submit.prevent="salvar">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <p class="text-subtitle1 text-weight-bold q-ma-none">Dados do Membro</p>
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

              <membro-form :form="form" :readonly="!editando" />
            </q-card-section>
          </q-card>
        </q-form>
      </div>

      <!-- Painel lateral -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Informações</p>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="calendar_today" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Cadastrado em</q-item-label>
                  <q-item-label>{{ formatarDataHora(membro.createdAt) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="update" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Atualizado em</q-item-label>
                  <q-item-label>{{ formatarDataHora(membro.updatedAt) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="idade !== null">
                <q-item-section avatar>
                  <q-icon name="cake" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Idade</q-item-label>
                  <q-item-label>{{ idade }} anos</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <membro-usuario
          :membro-uuid="membro.uuid"
          :membro-nome="membro.nome"
          :cpf="membro.cpf"
          :email="membro.email"
          :usuario-uuid="membro.usuarioUuid ?? null"
          class="q-mt-md"
          @criado="carregar"
        />

        <membro-vinculos :membro-uuid="membro.uuid" :membro-nome="membro.nome" class="q-mt-md" />
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, toRefs, watch } from "vue";
import { useRoute } from "vue-router";
import type { Membro } from "src/@modules/membresia/membresia.http";
import MembroForm, { membroFormParaInput, novoMembroForm } from "./membroForm.vue";
import { MembresiaService } from "./membresia.service";
import MembroVinculos from "./membroVinculos.vue";
import MembroUsuario from "./membroUsuario.vue";

export default defineComponent({
  name: "MembroEditar",
  components: { MembroForm, MembroVinculos, MembroUsuario },
  setup() {
    const $route = useRoute();
    const $service = new MembresiaService();
    const uuid = computed(() => $route.params.uuid as string);

    const data = reactive({
      membro: null as Membro | null,
      naoEncontrado: false,
      editando: false,
    });
    const form = reactive(novoMembroForm());
    const formRef = ref();

    const idade = computed(() => {
      const nasc = data.membro?.dataNascimento;
      if (!nasc) return null;
      const [ano, mes, dia] = nasc.split("-").map(Number);
      const hoje = new Date();
      let anos = hoje.getFullYear() - ano!;
      if (hoje.getMonth() + 1 < mes! || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia!))
        anos--;
      return anos;
    });

    async function carregar() {
      const membro = await $service.buscarPorUuid(uuid.value);
      data.membro = membro;
      data.naoEncontrado = !membro;
      Object.assign(form, novoMembroForm(membro));
    }

    async function salvar() {
      const ok = await $service.alterar(uuid.value, membroFormParaInput(form));
      if (ok) {
        data.editando = false;
        await carregar();
      }
    }

    function cancelarEdicao() {
      data.editando = false;
      Object.assign(form, novoMembroForm(data.membro));
      formRef.value?.resetValidation();
    }

    async function excluir() {
      await $service.deletar(uuid.value);
    }

    function formatarDataHora(iso: string) {
      if (!iso) return "-";
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Recarrega ao navegar para outro membro (ex.: clicando num vínculo)
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
      idade,
      salvar,
      cancelarEdicao,
      excluir,
      formatarDataHora,
      carregar,
    };
  },
});
</script>
