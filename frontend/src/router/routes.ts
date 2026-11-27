import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    component: () => import("layouts/BlankLayout.vue"),
    children: [{ path: "", name: "login", component: () => import("pages/auth/login/home.vue") }],
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
      {
        path: "membros",
        name: "membros",
        component: () => import("pages/membresia/membroListar.vue"),
      },
      {
        path: "membros/criar",
        name: "membros.criar",
        component: () => import("pages/membresia/membroIncluir.vue"),
      },
      {
        path: "membros/:uuid",
        name: "membros.detalhe",
        component: () => import("pages/membresia/membroEditar.vue"),
      },
      {
        path: "admin/empresas",
        name: "admin.empresas",
        component: () => import("pages/admin/empresaListar.vue"),
      },
      {
        path: "admin/empresas/criar",
        name: "admin.empresas.criar",
        component: () => import("pages/admin/empresaIncluir.vue"),
      },
      {
        path: "admin/empresas/:uuid",
        name: "admin.empresas.editar",
        component: () => import("pages/admin/empresaEditar.vue"),
      },
      {
        path: "imoveis/proprietarios",
        name: "imoveis.proprietarios",
        component: () => import("pages/imoveis/pessoaListar.vue"),
        meta: { papel: "proprietario" },
      },
      {
        path: "imoveis/inquilinos",
        name: "imoveis.inquilinos",
        component: () => import("pages/imoveis/pessoaListar.vue"),
        meta: { papel: "inquilino" },
      },
      {
        path: "imoveis/pessoas/criar",
        name: "imoveis.pessoas.criar",
        component: () => import("pages/imoveis/pessoaIncluir.vue"),
      },
      {
        path: "imoveis/pessoas/:uuid",
        name: "imoveis.pessoas.detalhe",
        component: () => import("pages/imoveis/pessoaEditar.vue"),
      },
      {
        path: "imoveis/imoveis",
        name: "imoveis.imoveis",
        component: () => import("pages/imoveis/imovelListar.vue"),
      },
      {
        path: "imoveis/imoveis/criar",
        name: "imoveis.imoveis.criar",
        component: () => import("pages/imoveis/imovelIncluir.vue"),
      },
      {
        path: "imoveis/imoveis/:uuid",
        name: "imoveis.imoveis.detalhe",
        component: () => import("pages/imoveis/imovelEditar.vue"),
      },
      {
        path: "imoveis",
        name: "imoveis.painel",
        component: () => import("pages/imoveis/painel.vue"),
      },
      {
        path: "imoveis/contratos",
        name: "imoveis.contratos",
        component: () => import("pages/imoveis/contratoListar.vue"),
      },
      {
        path: "imoveis/contratos/criar",
        name: "imoveis.contratos.criar",
        component: () => import("pages/imoveis/contratoIncluir.vue"),
      },
      {
        path: "imoveis/contratos/:uuid",
        name: "imoveis.contratos.detalhe",
        component: () => import("pages/imoveis/contratoDetalhe.vue"),
      },
      {
        path: "imoveis/contas",
        name: "imoveis.contas",
        component: () => import("pages/imoveis/contaListar.vue"),
      },
      {
        path: "imoveis/contas/criar",
        name: "imoveis.contas.criar",
        component: () => import("pages/imoveis/contaIncluir.vue"),
      },
      {
        path: "imoveis/contas/:uuid",
        name: "imoveis.contas.detalhe",
        component: () => import("pages/imoveis/contaEditar.vue"),
      },
      {
        path: "apriscos",
        name: "apriscos",
        component: () => import("pages/aprisco/apriscoListar.vue"),
      },
      {
        path: "apriscos/criar",
        name: "apriscos.criar",
        component: () => import("pages/aprisco/apriscoIncluir.vue"),
      },
      {
        path: "apriscos/:uuid",
        name: "apriscos.detalhe",
        component: () => import("pages/aprisco/apriscoEditar.vue"),
      },
      {
        path: "apriscos/:uuid/lider",
        name: "apriscos.lider",
        component: () => import("pages/aprisco/apriscoVisaoLider.vue"),
      },
      {
        path: "notificacao",
        name: "notificacao",
        component: () => import("pages/notificacao/home.vue"),
      },
    ],
  },
  {
    path: "/publico/eventos/:eventoUuid",
    component: () => import("layouts/BlankLayout.vue"),
    children: [
      {
        path: "",
        name: "eventos.publico",
        component: () => import("pages/portalEventos/pedido/home.vue"),
      },
    ],
  },

  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
