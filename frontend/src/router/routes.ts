import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("layouts/BlankLayout.vue"),
    children: [{ path: "", component: () => import("pages/auth/login/home.vue") }],
  },
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", name: "home", component: () => import("pages/home.vue") },
      {
        path: "eventos",
        name: "eventos",
        component: () => import("pages/portalEventos/eventos/home.vue"),
      },
      {
        path: "eventos/criar",
        name: "eventos.criar",
        component: () => import("pages/portalEventos/eventos/criar/home.vue"),
      },
      {
        path: "eventos/:uuid",
        name: "eventos.detalhe",
        component: () => import("pages/portalEventos/eventos/[uuid]/home.vue"),
      },
    ],
  },

  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
