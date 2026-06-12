<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-primary">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="drawerAberto = !drawerAberto"
        />
        <q-toolbar-title class="text-weight-bold">Kehila</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerAberto" show-if-above bordered class="bg-grey-1">
      <q-list padding>
        <q-item-label header class="text-grey-6 text-weight-bold text-caption q-mt-sm">
          MENU
        </q-item-label>

        <template v-for="item in menuItems">
          <q-item-label
            v-if="item.type === 'section'"
            :key="'sec-' + item.label"
            header
            class="text-grey-6 text-weight-bold text-caption q-mt-sm"
          >
            {{ item.label }}
          </q-item-label>
          <q-item
            v-else
            :key="item.label"
            clickable
            v-ripple
            :to="{ name: item.route }"
            active-class="text-primary bg-blue-1"
            class="rounded-borders q-mb-xs"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.label }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>

        <q-separator class="q-my-md" />

        <q-item clickable v-ripple class="rounded-borders text-negative" @click="sair">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Sair</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue";
import { useRouter } from "vue-router";
import { AuthCookiesQuasar } from "src/@modules/auth/authCookies.quasar";

const MENU_ITEMS = [
  { label: "Início", icon: "home", route: "home" },
  { label: "Eventos", icon: "event", route: "eventos" },
  { label: "FINANCEIRO", type: "section" },
  { label: "Contas Bancárias", icon: "account_balance", route: "financeiro.contas-bancarias" },
];

export default defineComponent({
  name: "MainLayout",
  setup() {
    const $router = useRouter();
    const $authCookies = new AuthCookiesQuasar();

    const data = reactive({
      drawerAberto: false,
      menuItems: MENU_ITEMS,
    });

    function sair() {
      $authCookies.deleteToken();
      $authCookies.deleteRefreshToken();
      void $router.push({ name: "login" });
    }

    return {
      ...toRefs(data),
      sair,
    };
  },
});
</script>
