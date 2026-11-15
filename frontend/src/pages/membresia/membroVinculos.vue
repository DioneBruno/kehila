<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="row items-center justify-between q-mb-sm">
        <p class="text-subtitle1 text-weight-bold q-ma-none">Família / Vínculos</p>
        <q-btn flat dense icon="add" label="Adicionar" color="primary" @click="abrirDialog" />
      </div>

      <div v-if="carregando" class="text-center q-pa-md">
        <q-spinner color="primary" size="24px" />
      </div>
      <p v-else-if="!vinculos.length" class="text-caption text-grey-6 q-ma-none">
        Nenhum vínculo cadastrado.
      </p>
      <q-list v-else dense separator>
        <q-item v-for="v in vinculos" :key="v.uuid">
          <q-item-section avatar>
            <q-icon name="family_restroom" color="grey-6" />
          </q-item-section>
          <q-item-section>
            <q-item-label caption>{{ labelTipoVinculo(v.tipo) }}</q-item-label>
            <q-item-label>
              <router-link
                :to="{ name: 'membros.detalhe', params: { uuid: v.membroVinculadoUuid } }"
                class="text-primary"
                style="text-decoration: none"
              >
                {{ v.membroVinculadoNome || "Sem nome" }}
              </router-link>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense icon="close" color="grey-6" size="sm" @click="remover(v.uuid)">
              <q-tooltip>Remover vínculo</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <!-- Dialog de novo vínculo -->
    <q-dialog v-model="dialog">
      <q-card style="width: 460px; max-width: 90vw">
        <q-form greedy @submit.prevent="salvar">
          <q-card-section>
            <p class="text-h6 q-ma-none">Adicionar vínculo</p>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-select
              v-model="form.membroVinculadoUuid"
              :options="opcoesMembros"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              use-input
              input-debounce="0"
              outlined
              dense
              label="Membro"
              :rules="[(v) => !!v || 'Selecione o membro']"
              @filter="filtrarMembros"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">Nenhum membro encontrado</q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-select
              v-model="form.tipo"
              :options="TIPOS_VINCULO"
              emit-value
              map-options
              outlined
              dense
              :label="`${nomeSelecionado} é ___ de ${nomeMembro}`"
              :rules="[(v) => !!v || 'Selecione o tipo']"
            />

            <q-select
              v-if="form.tipo"
              v-model="form.tipoInverso"
              :options="opcoesInverso"
              emit-value
              map-options
              outlined
              dense
              :label="`${nomeMembro} é ___ de ${nomeSelecionado}`"
              hint="Registro inverso, criado automaticamente"
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
import { computed, defineComponent, onMounted, reactive, toRefs, watch, type PropType } from "vue";
import type { Membro, TipoVinculo, Vinculo } from "src/@modules/membresia/membresia.http";
import {
  INVERSOS_VINCULO,
  MembresiaService,
  TIPOS_VINCULO,
  labelTipoVinculo,
} from "./membresia.service";

type Opcao = { value: string; label: string };

export default defineComponent({
  name: "MembroVinculos",
  props: {
    membroUuid: { type: String, required: true },
    membroNome: { type: String as PropType<string | null>, default: null },
  },
  setup(props) {
    const $service = new MembresiaService();

    const data = reactive({
      vinculos: [] as Vinculo[],
      carregando: false,
      dialog: false,
      membros: [] as Membro[],
      opcoesMembros: [] as Opcao[],
    });

    const form = reactive({
      membroVinculadoUuid: null as string | null,
      tipo: null as TipoVinculo | null,
      tipoInverso: null as TipoVinculo | null,
    });

    const nomeMembro = computed(() => props.membroNome || "Membro");

    // Membros disponíveis: exclui o próprio membro e os já vinculados
    const membrosDisponiveis = computed<Opcao[]>(() => {
      const vinculados = new Set(data.vinculos.map((v) => v.membroVinculadoUuid));
      return data.membros
        .filter((m) => m.uuid !== props.membroUuid && !vinculados.has(m.uuid))
        .map((m) => ({ value: m.uuid, label: m.nome || "Sem nome" }));
    });

    const nomeSelecionado = computed(
      () =>
        membrosDisponiveis.value.find((m) => m.value === form.membroVinculadoUuid)?.label ||
        "Membro selecionado",
    );

    const opcoesInverso = computed(() =>
      form.tipo
        ? INVERSOS_VINCULO[form.tipo].map((t) => ({ value: t, label: labelTipoVinculo(t) }))
        : [],
    );

    // Ao trocar o tipo, sugere o inverso padrão
    watch(
      () => form.tipo,
      (tipo) => {
        form.tipoInverso = tipo ? INVERSOS_VINCULO[tipo][0]! : null;
      },
    );

    async function carregar() {
      data.carregando = true;
      data.vinculos = (await $service.listarVinculos(props.membroUuid)) ?? [];
      data.carregando = false;
    }

    async function abrirDialog() {
      Object.assign(form, { membroVinculadoUuid: null, tipo: null, tipoInverso: null });
      if (!data.membros.length) data.membros = (await $service.listar()) ?? [];
      data.opcoesMembros = membrosDisponiveis.value;
      data.dialog = true;
    }

    function filtrarMembros(busca: string, update: (fn: () => void) => void) {
      update(() => {
        const termo = busca.toLowerCase();
        data.opcoesMembros = membrosDisponiveis.value.filter((m) =>
          m.label.toLowerCase().includes(termo),
        );
      });
    }

    async function salvar() {
      if (!form.membroVinculadoUuid || !form.tipo) return;
      const ok = await $service.vincular(props.membroUuid, [
        {
          membroVinculadoUuid: form.membroVinculadoUuid,
          tipo: form.tipo,
          tipoInverso: form.tipoInverso,
        },
      ]);
      if (ok) {
        data.dialog = false;
        await carregar();
      }
    }

    async function remover(vinculoUuid: string) {
      if (await $service.removerVinculo(props.membroUuid, vinculoUuid)) await carregar();
    }

    watch(
      () => props.membroUuid,
      () => void carregar(),
    );
    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      form,
      nomeMembro,
      nomeSelecionado,
      opcoesInverso,
      TIPOS_VINCULO,
      labelTipoVinculo,
      abrirDialog,
      filtrarMembros,
      salvar,
      remover,
    };
  },
});
</script>
