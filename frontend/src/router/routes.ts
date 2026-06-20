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
        component: () => import("pages/portalEventos/eventos/eventoListar.vue"),
      },
      {
        path: "eventos/criar",
        name: "eventos.criar",
        component: () => import("pages/portalEventos/eventos/eventoIncluir.vue"),
      },
      {
        path: "eventos/:uuid",
        name: "eventos.detalhe",
        component: () => import("pages/portalEventos/eventos/eventoEditar.vue"),
      },
      {
        path: "eventos/:uuid/lotes",
        name: "eventos.lotes",
        component: () => import("pages/portalEventos/eventos/loteListar.vue"),
      },
      {
        path: "bi",
        name: "bi",
        component: () => import("pages/BI/home.vue"),
      },
      {
        path: "empresa",
        name: "empresa",
        component: () => import("pages/empresa/empresaEditar.vue"),
      },
      {
        path: "financeiro/contas-bancarias",
        name: "financeiro.contas-bancarias",
        component: () => import("pages/financeiro/contaBancaria/contaBancariaListar.vue"),
      },
      {
        path: "financeiro/contas-bancarias/criar",
        name: "financeiro.contas-bancarias.criar",
        component: () => import("pages/financeiro/contaBancaria/contaBancariaIncluir.vue"),
      },
      {
        path: "financeiro/contas-bancarias/:uuid",
        name: "financeiro.contas-bancarias.detalhe",
        component: () => import("pages/financeiro/contaBancaria/contaBancariaEditar.vue"),
      },
      {
        path: "financeiro/cobrancas",
        name: "financeiro.cobrancas",
        component: () => import("pages/financeiro/cobranca/cobrancaListar.vue"),
      },
      {
        path: "financeiro/pagamentos",
        name: "financeiro.pagamentos",
        component: () => import("pages/financeiro/pagamento/pagamentoListar.vue"),
      },
      {
        path: "usuarios",
        name: "usuarios",
        component: () => import("pages/usuario/usuarioListar.vue"),
      },
      {
        path: "usuarios/criar",
        name: "usuarios.criar",
        component: () => import("pages/usuario/usuarioIncluir.vue"),
      },
      {
        path: "usuarios/:uuid",
        name: "usuarios.detalhe",
        component: () => import("pages/usuario/usuarioEditar.vue"),
      },
    ],
  },
  {
    path: "/publico/eventos/:eventoUuid",
    name: "eventos.publico",
    component: () => import("layouts/BlankLayout.vue"),
    children: [{ path: "", component: () => import("pages/portalEventos/pedido/home.vue") }],
  },

  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
