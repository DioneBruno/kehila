<template>
  <q-page padding>
    <!-- Saudação -->
    <div class="page-header q-mb-lg">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ saudacao }}{{ primeiroNome ? `, ${primeiroNome}` : "" }}!
        </p>
        <p class="text-caption text-grey-6 q-ma-none">{{ empresa || "Bem-vindo de volta" }}</p>
      </div>
    </div>

    <!-- Atalhos (administradores) -->
    <template v-if="isAdmin">
      <p class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm">Acesso rápido</p>
      <div class="row q-col-gutter-md q-mb-lg">
        <div v-for="atalho in atalhos" :key="atalho.route" class="col-6 col-sm-4 col-md-3 col-lg-2">
          <q-card
            v-ripple
            flat
            bordered
            class="atalho cursor-pointer q-hoverable full-height"
            @click="irPara(atalho.route)"
          >
            <span class="q-focus-helper" />
            <q-card-section class="column items-start q-gutter-y-sm">
              <q-avatar :icon="atalho.icon" size="40px" class="atalho__icon" />
              <div class="text-weight-medium">{{ atalho.label }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>

    <!-- Apriscos em que o usuário logado é líder -->
    <template v-if="apriscosLiderados.length">
      <p class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm">Meus apriscos</p>
      <div class="row q-col-gutter-md">
        <div
          v-for="aprisco in apriscosLiderados"
          :key="aprisco.uuid"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <q-card
            v-ripple
            flat
            bordered
            class="cursor-pointer q-hoverable full-height column"
            @click="abrirAprisco(aprisco.uuid)"
          >
            <span class="q-focus-helper" />
            <q-card-section class="col">
              <div class="text-overline text-primary">
                <q-icon name="star" class="q-mr-xs" />Meu aprisco
              </div>
              <div class="text-h6 ellipsis">{{ aprisco.nome }}</div>
              <div v-if="descricaoEncontro(aprisco)" class="text-caption text-grey-7">
                {{ descricaoEncontro(aprisco) }}
              </div>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                label="Acessar"
                icon-right="chevron_right"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </template>

    <div
      v-else-if="!isAdmin && carregado"
      class="column items-center text-center text-grey-6 q-pa-xl"
    >
      <q-icon name="waving_hand" size="48px" class="q-mb-sm" />
      <p class="q-ma-none">Nada por aqui ainda.</p>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs } from "vue";
import { useRouter } from "vue-router";
import type { Aprisco } from "src/@modules/aprisco/aprisco.http";
import { ApriscoService, descricaoEncontro } from "./aprisco/aprisco.service";
import TokenDecode from "src/@modules/auth/tokenDecode";

const ATALHOS = [
  { label: "Eventos", icon: "event", route: "eventos" },
  { label: "Membros", icon: "diversity_3", route: "membros" },
  { label: "Apriscos", icon: "holiday_village", route: "apriscos" },
  { label: "Cobranças", icon: "receipt_long", route: "financeiro.cobrancas" },
  { label: "Pagamentos", icon: "payments", route: "financeiro.pagamentos" },
  { label: "BI", icon: "dashboard", route: "bi" },
];

function saudacaoDoDia() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default defineComponent({
  name: "pageHome",
  setup() {
    const apriscoService = new ApriscoService();
    const router = useRouter();
    const token = TokenDecode.execute();
    const data = reactive({
      apriscosLiderados: [] as Aprisco[],
      carregado: false,
    });

    onMounted(async () => {
      const modulos = token?.company?.modulos ?? ["igreja"];
      if (!modulos.includes("igreja")) {
        // Sem módulo igreja: vai ao painel de imóveis (quando a rota existir) e não lista apriscos.
        if (modulos.includes("imoveis") && router.hasRoute("imoveis.painel")) {
          await router.replace({ name: "imoveis.painel" });
        }
        data.carregado = true;
        return;
      }
      data.apriscosLiderados = (await apriscoService.listarLiderados()) ?? [];
      data.carregado = true;
    });

    const irPara = (name: string) => void router.push({ name });

    const abrirAprisco = (uuid: string) =>
      router.push({ name: "apriscos.lider", params: { uuid } });

    return {
      descricaoEncontro,
      saudacao: saudacaoDoDia(),
      primeiroNome: (token?.user?.name ?? "").trim().split(/\s+/)[0] ?? "",
      empresa: token?.company?.name ?? "",
      isAdmin: token?.user?.position === "admin",
      atalhos: ATALHOS,
      irPara,
      ...toRefs(data),
      abrirAprisco,
    };
  },
});
</script>

<style lang="scss" scoped>
.atalho__icon {
  background: rgba($primary, 0.09);
  color: $primary;
}

.atalho {
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  }
}
</style>
