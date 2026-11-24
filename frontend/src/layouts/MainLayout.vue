<template>
  <q-layout view="lHh LpR lFf" class="main-layout">
    <!-- Cabeçalho -->
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <q-btn flat dense round icon="menu" aria-label="Abrir menu" @click="alternarDrawer" />

        <q-toolbar-title class="app-title">
          <div class="app-title__main ellipsis">{{ layout?.header?.titulo }}</div>
          <div v-if="layout?.header?.subTitulo" class="app-title__sub ellipsis">
            {{ layout?.header?.subTitulo }}
          </div>
        </q-toolbar-title>

        <q-btn flat round dense aria-label="Conta">
          <q-avatar size="34px" color="white" text-color="primary" class="text-weight-bold">
            {{ iniciais }}
          </q-avatar>
          <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
            <q-list style="min-width: 220px">
              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">{{ iniciais }}</q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium ellipsis">{{
                    usuario?.name
                  }}</q-item-label>
                  <q-item-label caption class="ellipsis">{{ usuario?.email }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item
                v-if="dispositivoConfiavel"
                v-close-popup
                clickable
                @click="esquecerDispositivo"
              >
                <q-item-section avatar><q-icon name="phonelink_erase" /></q-item-section>
                <q-item-section>Esquecer este dispositivo</q-item-section>
              </q-item>
              <q-item v-close-popup clickable class="text-negative" @click="sair">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Sair</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Menu lateral: overlay no celular, compacto no tablet, fixo no desktop -->
    <q-drawer
      v-model="drawerAberto"
      show-if-above
      :breakpoint="599"
      :width="264"
      :mini="modoMini"
      :mini-width="72"
      :mini-to-overlay="telaTablet"
      bordered
      class="app-drawer"
      @mouseenter="expandirMini = true"
      @mouseleave="expandirMini = false"
    >
      <q-scroll-area class="fit">
        <q-list padding class="app-nav">
          <template v-for="item in itensMenu">
            <q-item-label
              v-if="item.type === 'section'"
              v-show="!modoMini"
              :key="'sec-' + item.label"
              header
              class="app-nav__section"
            >
              {{ item.label }}
            </q-item-label>
            <q-separator
              v-if="item.type === 'section' && modoMini"
              :key="'sep-' + item.label"
              class="q-my-sm q-mx-md"
            />
            <q-item
              v-if="item.type !== 'section'"
              :key="item.label"
              v-ripple
              clickable
              :to="{ name: item.route }"
              :exact="item.route === 'home'"
              active-class="app-nav__item--active"
              class="app-nav__item"
              @click="aoNavegar"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
              </q-item-section>
              <q-tooltip v-if="modoMini" anchor="center right" self="center left" :offset="[8, 0]">
                {{ item.label }}
              </q-tooltip>
            </q-item>
          </template>

          <q-separator class="q-my-md" />

          <q-item
            v-if="dispositivoConfiavel"
            v-ripple
            clickable
            class="app-nav__item"
            @click="esquecerDispositivo"
          >
            <q-item-section avatar>
              <q-icon name="phonelink_erase" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Esquecer este dispositivo</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-ripple clickable class="app-nav__item text-negative" @click="sair">
            <q-item-section avatar>
              <q-icon name="logout" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Sair</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Navegação inferior no celular -->
    <q-footer v-if="mostrarNavInferior" bordered class="app-bottom-nav">
      <q-tabs
        v-model="abaInferior"
        dense
        no-caps
        indicator-color="transparent"
        active-color="primary"
        class="text-grey-7"
        :breakpoint="0"
      >
        <q-tab
          v-for="item in itensNavInferior"
          :key="item.route!"
          :name="item.route!"
          :icon="item.icon!"
          :label="item.curto || item.label"
          @click="irPara(item.route!)"
        />
        <q-tab name="mais" icon="menu" label="Mais" @click="drawerAberto = true" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  inject,
  onMounted,
  reactive,
  ref,
  toRefs,
  watchEffect,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { AuthCookiesQuasar } from "src/@modules/auth/authCookies.quasar";
import { MainLayoutService } from "./MainLayout.service";
import { useLayoutStore } from "src/stores/layout";
import TokenDecode from "src/@modules/auth/tokenDecode";
import type { LoginHttp } from "src/@modules/auth/login.http";
import { MENU_ITEMS, filtrarMenu, type MenuItem } from "./menu";

const ROTAS_NAV_INFERIOR_IGREJA = ["home", "eventos", "membros", "apriscos"];
const ROTAS_NAV_INFERIOR_IMOVEIS = ["imoveis.painel", "imoveis.contratos", "imoveis.imoveis"];

export default defineComponent({
  name: "MainLayout",
  setup() {
    const $q = useQuasar();
    const $router = useRouter();
    const $route = useRoute();
    const $authCookies = new AuthCookiesQuasar();
    const $service = new MainLayoutService();
    const $layoutStore = useLayoutStore();
    const data = reactive({
      drawerAberto: false,
      expandirMini: false,
      layout: computed(() => $layoutStore.layout),
    });

    // Lido dentro de computed para refletir o token atual (troca de usuário sem recarregar).
    const token = computed(() => TokenDecode.execute());
    const itensMenu = computed<MenuItem[]>(() => {
      const t = token.value;
      const externo = !t?.user?.position && !!t?.user?.roles?.includes("usuario-externo");
      return filtrarMenu(
        MENU_ITEMS,
        t?.company?.modulos ?? ["igreja"],
        t?.user?.position === "admin",
        !externo,
      );
    });

    const rotasNavInferior = computed(() => {
      const modulos = token.value?.company?.modulos ?? ["igreja"];
      return modulos.includes("igreja") ? ROTAS_NAV_INFERIOR_IGREJA : ROTAS_NAV_INFERIOR_IMOVEIS;
    });

    const itensNavInferior = computed(() => {
      const t = token.value;
      const modulos = t?.company?.modulos ?? ["igreja"];
      // Igreja: só administradores têm a barra (como antes). Imóveis: qualquer usuário interno.
      if (modulos.includes("igreja") && t?.user?.position !== "admin") return [];
      return itensMenu.value.filter((i) => i.route && rotasNavInferior.value.includes(i.route));
    });

    // Aba ativa derivada da rota atual (ex.: "membros.detalhe" -> "membros").
    // "Mais" só abre o menu e nunca fica marcada.
    const abaInferior = computed({
      get: () => {
        const nome = String($route.name ?? "");
        return rotasNavInferior.value.find((r) => nome === r || nome.startsWith(`${r}.`)) ?? "";
      },
      set: () => {},
    });

    function irPara(name: string) {
      void $router.push({ name });
    }

    const celular = computed(() => $q.screen.xs);
    const telaTablet = computed(() => $q.screen.sm);
    const modoMini = computed(() => $q.screen.sm && !data.expandirMini);
    const mostrarNavInferior = computed(() => celular.value && itensNavInferior.value.length > 0);

    const iniciais = computed(() => {
      const nome = (token.value?.user?.name ?? "").trim();
      if (!nome) return "?";
      const partes = nome.split(/\s+/);
      const primeira = partes[0]?.[0] ?? "";
      const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
      return (primeira + ultima).toUpperCase();
    });

    // Celular/desktop: abre/fecha o menu. Tablet: expande/recolhe o menu compacto.
    function alternarDrawer() {
      if ($q.screen.sm) {
        data.drawerAberto = true;
        data.expandirMini = !data.expandirMini;
        return;
      }
      data.drawerAberto = !data.drawerAberto;
    }

    function aoNavegar() {
      if (celular.value) data.drawerAberto = false;
      data.expandirMini = false;
    }

    onMounted(async () => {
      await ping();
    });

    watchEffect(() => {
      const titulo = $layoutStore.layout?.telaLogin?.titulo;
      if (titulo) document.title = titulo;
    });

    const $loginHttp = inject<LoginHttp>("loginHttp");
    const dispositivoConfiavel = ref(!!$authCookies.getDeviceToken());

    // Sair mantém a confiança no dispositivo: a próxima visita entra direto.
    function sair() {
      $authCookies.deleteToken();
      $authCookies.marcarSaidaManual();
      void $router.push({ name: "login" });
    }

    async function esquecerDispositivo() {
      const deviceToken = $authCookies.getDeviceToken();
      $authCookies.deleteDeviceToken();
      dispositivoConfiavel.value = false;
      if (deviceToken) {
        try {
          await $loginHttp?.trustedDeviceRevoke(deviceToken);
        } catch (error) {
          console.log(error);
        }
      }
      sair();
    }

    async function ping() {
      await $service.ping();
    }

    return {
      ...toRefs(data),
      usuario: computed(() => token.value?.user),
      itensMenu,
      itensNavInferior,
      modoMini,
      telaTablet,
      abaInferior,
      irPara,
      mostrarNavInferior,
      iniciais,
      alternarDrawer,
      aoNavegar,
      sair,
      dispositivoConfiavel,
      esquecerDispositivo,
    };
  },
});
</script>

<style lang="scss" scoped>
.app-header {
  background: linear-gradient(90deg, $primary 0%, lighten($primary, 8%) 100%);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.12);
}

.app-toolbar {
  min-height: 56px;
  gap: 4px;
  padding-top: env(safe-area-inset-top, 0px);
}

.app-title {
  min-width: 0;
  padding-left: 8px;
  line-height: 1.15;

  &__main {
    font-weight: 700;
    font-size: 1.05rem;
  }

  &__sub {
    font-size: 0.7rem;
    opacity: 0.8;
    font-weight: 400;
  }
}

.app-drawer {
  :deep(.q-drawer) {
    background: #fff;
  }
}

.app-nav {
  padding-left: 8px;
  padding-right: 8px;

  &__section {
    color: #8a94a3;
    font-weight: 700;
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    padding-top: 16px;
    padding-bottom: 6px;
  }

  &__item {
    border-radius: 10px;
    margin-bottom: 2px;
    min-height: 44px;
    color: #3a4452;

    :deep(.q-item__section--avatar) {
      min-width: 40px;
      color: #6b7686;
    }
  }

  &__item--active {
    background: rgba($primary, 0.09);
    color: $primary;
    font-weight: 600;

    :deep(.q-item__section--avatar) {
      color: $primary;
    }
  }
}

.app-bottom-nav {
  background: #fff;
  padding-bottom: env(safe-area-inset-bottom, 0px);

  :deep(.q-tab) {
    flex: 1 1 0;
    min-height: 58px;
    padding: 0 4px;
  }

  :deep(.q-tab__label) {
    font-size: 0.7rem;
    margin-top: 2px;
  }

  :deep(.q-tab--active .q-tab__icon) {
    transform: scale(1.1);
  }
}
</style>
