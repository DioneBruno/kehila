<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="row items-center justify-between q-mb-sm">
        <p class="text-subtitle1 text-weight-bold q-ma-none">
          Integrantes
          <q-badge
            v-if="integrantes.length"
            color="grey-5"
            :label="integrantes.length"
            class="q-ml-xs"
          />
        </p>
        <q-btn
          flat
          dense
          icon="person_add"
          label="Adicionar"
          color="primary"
          @click="abrirDialog"
        />
      </div>

      <div v-if="carregando" class="text-center q-pa-md">
        <q-spinner color="primary" size="24px" />
      </div>
      <p v-else-if="!integrantes.length" class="text-caption text-grey-6 q-ma-none">
        Nenhum integrante vinculado.
      </p>
      <q-list v-else dense separator>
        <q-item v-for="i in integrantes" :key="i.uuid">
          <q-item-section avatar>
            <q-icon :name="papelIntegrante(i.papel).icon" :color="papelIntegrante(i.papel).color" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <router-link
                :to="{ name: 'membros.detalhe', params: { uuid: i.pessoaUuid } }"
                class="text-primary"
                style="text-decoration: none"
              >
                {{ i.nome || "Sem nome" }}
              </router-link>
            </q-item-label>
            <q-item-label v-if="i.telefone || i.email" caption>
              {{ [i.telefone, i.email].filter(Boolean).join(" · ") }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              outline
              :color="papelIntegrante(i.papel).color"
              :label="papelIntegrante(i.papel).label"
            />
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense icon="close" color="grey-6" size="sm" @click="remover(i)">
              <q-tooltip>Remover do aprisco</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <!-- Dialog de novo integrante -->
    <q-dialog v-model="dialog">
      <q-card style="width: 460px; max-width: 90vw">
        <q-form greedy @submit.prevent="salvar">
          <q-card-section>
            <p class="text-h6 q-ma-none">Adicionar integrante</p>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-select
              v-model="form.pessoaUuid"
              :options="opcoesPessoas"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              use-input
              input-debounce="0"
              outlined
              dense
              label="Pessoa"
              :rules="[(v) => !!v || 'Selecione a pessoa']"
              @filter="filtrarPessoas"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">Nenhuma pessoa disponível</q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-select
              v-model="form.papel"
              :options="PAPEIS_INTEGRANTE"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              outlined
              dense
              label="Papel"
              :rules="[(v) => !!v || 'Selecione o papel']"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
            <q-btn unelevated type="submit" label="Salvar" color="primary" icon="save" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs, watch } from "vue";
import type { Integrante, PapelIntegrante } from "src/@modules/aprisco/aprisco.http";
import type { Membro } from "src/@modules/membresia/membresia.http";
import { MembresiaService } from "../membresia/membresia.service";
import { ApriscoService, PAPEIS_INTEGRANTE, papelIntegrante } from "./aprisco.service";

type Opcao = { value: string; label: string };

export default defineComponent({
  name: "ApriscoIntegrantes",
  props: {
    apriscoUuid: { type: String, required: true },
  },
  setup(props) {
    const $service = new ApriscoService();
    const $membresia = new MembresiaService();

    const data = reactive({
      integrantes: [] as Integrante[],
      carregando: false,
      dialog: false,
      pessoas: [] as Membro[],
      opcoesPessoas: [] as Opcao[],
    });

    const form = reactive({
      pessoaUuid: null as string | null,
      papel: "MEMBRO" as PapelIntegrante,
    });

    // Pessoas disponíveis: exclui quem já é integrante
    const pessoasDisponiveis = computed<Opcao[]>(() => {
      const vinculadas = new Set(data.integrantes.map((i) => i.pessoaUuid));
      return data.pessoas
        .filter((p) => !vinculadas.has(p.uuid))
        .map((p) => ({ value: p.uuid, label: p.nome || "Sem nome" }));
    });

    async function carregar() {
      data.carregando = true;
      data.integrantes = (await $service.listarIntegrantes(props.apriscoUuid)) ?? [];
      data.carregando = false;
    }

    async function abrirDialog() {
      Object.assign(form, { pessoaUuid: null, papel: "MEMBRO" });
      if (!data.pessoas.length) data.pessoas = (await $membresia.listar()) ?? [];
      data.opcoesPessoas = pessoasDisponiveis.value;
      data.dialog = true;
    }

    function filtrarPessoas(busca: string, update: (fn: () => void) => void) {
      update(() => {
        const termo = busca.toLowerCase();
        data.opcoesPessoas = pessoasDisponiveis.value.filter((p) =>
          p.label.toLowerCase().includes(termo),
        );
      });
    }

    async function salvar() {
      if (!form.pessoaUuid) return;
      const ok = await $service.vincularIntegrante(props.apriscoUuid, {
        pessoaUuid: form.pessoaUuid,
        papel: form.papel,
      });
      if (ok) {
        data.dialog = false;
        await carregar();
      }
    }

    async function remover(integrante: Integrante) {
      if (
        await $service.disvincularIntegrante(props.apriscoUuid, integrante.uuid, integrante.nome)
      ) {
        await carregar();
      }
    }

    watch(
      () => props.apriscoUuid,
      () => void carregar(),
    );
    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      form,
      PAPEIS_INTEGRANTE,
      papelIntegrante,
      abrirDialog,
      filtrarPessoas,
      salvar,
      remover,
    };
  },
});
</script>
