<!-- O form é um objeto reativo do pai, editado por este componente de propósito -->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="row q-col-gutter-md">
    <!-- Identificação -->
    <div class="col-12">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Identificação</p>
    </div>
    <div class="col-12 col-md-8">
      <q-input
        v-model="form.nome"
        label="Nome *"
        filled
        :readonly="readonly"
        :rules="[(v) => !!v?.trim() || 'O nome é obrigatório']"
        lazy-rules
      />
    </div>
    <div class="col-12 col-md-4">
      <q-toggle
        v-model="form.status"
        true-value="ativo"
        false-value="inativo"
        :label="form.status === 'ativo' ? 'Ativo' : 'Inativo'"
        :disable="readonly"
        class="q-mt-sm"
      />
    </div>
    <div class="col-12 col-sm-6">
      <q-select
        v-model="form.diaSemana"
        :options="diasSemana"
        label="Dia do encontro"
        filled
        clearable
        :readonly="readonly"
      />
    </div>
    <div class="col-12 col-sm-6">
      <q-input
        v-model="form.horario"
        label="Horário do encontro"
        filled
        mask="time"
        fill-mask="_"
        placeholder="20:00"
        :readonly="readonly"
        :rules="[validarHorario]"
        lazy-rules
      >
        <template #append>
          <q-icon name="schedule" class="cursor-pointer">
            <q-popup-proxy v-if="!readonly" cover transition-show="scale" transition-hide="scale">
              <q-time v-model="form.horario" format24h>
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="OK" color="primary" flat />
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>

    <!-- Localização -->
    <div class="col-12 q-mt-sm">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Localização</p>
    </div>
    <div class="col-12">
      <q-input v-model="form.endereco" label="Endereço" filled :readonly="readonly" />
    </div>
    <!-- <div class="col-12 col-sm-6 col-md-4">
      <q-input
        v-model="form.latitude"
        label="Latitude"
        filled
        inputmode="decimal"
        placeholder="-23.5505199"
        :readonly="readonly"
        :rules="[validarLatitude, validarPar]"
        lazy-rules
      />
    </div>
    <div class="col-12 col-sm-6 col-md-4">
      <q-input
        v-model="form.longitude"
        label="Longitude"
        filled
        inputmode="decimal"
        placeholder="-46.6333094"
        :readonly="readonly"
        :rules="[validarLongitude, validarPar]"
        lazy-rules
      />
    </div> -->
    <div class="col-12 col-md-4 row items-start q-gutter-sm q-pt-md">
      <q-btn
        v-if="!readonly"
        flat
        dense
        no-caps
        color="primary"
        icon="my_location"
        label="Usar minha localização"
        :loading="localizando"
        @click="usarMinhaLocalizacao"
      />
      <q-btn
        v-if="mapa"
        flat
        dense
        no-caps
        color="primary"
        icon="map"
        label="Ver no mapa"
        :href="mapa"
        target="_blank"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, type PropType } from "vue";
import { useQuasar } from "quasar";
import {
  DIAS_SEMANA,
  type Aprisco,
  type ApriscoInput,
  type ApriscoStatus,
  type DiaSemana,
} from "src/@modules/aprisco/aprisco.http";
import { linkMapa } from "./aprisco.service";

export type ApriscoFormModel = {
  nome: string;
  diaSemana: DiaSemana | null;
  /** HH:MM */
  horario: string;
  endereco: string;
  latitude: string;
  longitude: string;
  status: ApriscoStatus;
};

export function novoApriscoForm(aprisco?: Aprisco | null): ApriscoFormModel {
  return {
    nome: aprisco?.nome ?? "",
    diaSemana: aprisco?.diaSemana ?? null,
    horario: aprisco?.horario ?? "",
    endereco: aprisco?.endereco ?? "",
    latitude: aprisco?.latitude != null ? String(aprisco.latitude) : "",
    longitude: aprisco?.longitude != null ? String(aprisco.longitude) : "",
    status: aprisco?.status ?? "ativo",
  };
}

/** Aceita vírgula ou ponto como separador decimal. Vazio vira null. */
function paraNumero(v: string | null | undefined): number | null {
  const texto = String(v ?? "")
    .trim()
    .replace(",", ".");
  if (!texto) return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : NaN;
}

/** Remove o preenchimento da máscara ("2_:__" → "2"); vazio vira null */
function horarioParaInput(v: string | null | undefined): string | null {
  const texto = String(v ?? "")
    .replace(/_/g, "")
    .trim();
  return texto && texto !== ":" ? texto : null;
}

/** Converte o form em payload da API: campos de texto vazios viram null (limpa o valor no banco). */
export function apriscoFormParaInput(form: ApriscoFormModel): ApriscoInput {
  const vazioParaNull = (v: string | null) => (v && v.trim() ? v.trim() : null);
  return {
    nome: form.nome.trim(),
    diaSemana: form.diaSemana || null,
    horario: horarioParaInput(form.horario),
    endereco: vazioParaNull(form.endereco),
    latitude: paraNumero(form.latitude),
    longitude: paraNumero(form.longitude),
    status: form.status,
  };
}

export default defineComponent({
  name: "ApriscoForm",
  props: {
    form: { type: Object as PropType<ApriscoFormModel>, required: true },
    readonly: { type: Boolean, default: false },
  },
  setup(props) {
    const $q = useQuasar();
    const localizando = ref(false);

    function validarFaixa(v: string, limite: number, nome: string) {
      const n = paraNumero(v);
      if (n === null) return true;
      if (Number.isNaN(n) || n < -limite || n > limite)
        return `${nome} inválida (entre -${limite} e ${limite})`;
      return true;
    }
    const validarLatitude = (v: string) => validarFaixa(v, 90, "Latitude");
    const validarLongitude = (v: string) => validarFaixa(v, 180, "Longitude");
    const validarHorario = (v: string) => {
      const horario = horarioParaInput(v);
      return !horario || /^([01]\d|2[0-3]):[0-5]\d$/.test(horario) || "Horário inválido (HH:MM)";
    };
    const validarPar = () =>
      (paraNumero(props.form.latitude) === null) === (paraNumero(props.form.longitude) === null) ||
      "Informe latitude e longitude juntas";

    const mapa = computed(() => {
      const lat = paraNumero(props.form.latitude);
      const lng = paraNumero(props.form.longitude);
      return linkMapa({
        latitude: lat !== null && !Number.isNaN(lat) ? lat : null,
        longitude: lng !== null && !Number.isNaN(lng) ? lng : null,
        endereco: props.form.endereco?.trim() || null,
      });
    });

    function usarMinhaLocalizacao() {
      if (!navigator.geolocation) {
        $q.notify({ type: "warning", message: "Seu navegador não permite obter a localização" });
        return;
      }
      localizando.value = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          /* eslint-disable vue/no-mutating-props */
          props.form.latitude = pos.coords.latitude.toFixed(7);
          props.form.longitude = pos.coords.longitude.toFixed(7);
          /* eslint-enable vue/no-mutating-props */
          localizando.value = false;
        },
        () => {
          $q.notify({ type: "warning", message: "Não foi possível obter sua localização" });
          localizando.value = false;
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }

    return {
      diasSemana: DIAS_SEMANA,
      localizando,
      mapa,
      validarLatitude,
      validarLongitude,
      validarPar,
      validarHorario,
      usarMinhaLocalizacao,
    };
  },
});
</script>
