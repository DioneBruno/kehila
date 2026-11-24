export type Modulo = "igreja" | "imoveis";

export type MenuItem = {
  label: string;
  icon?: string;
  route?: string;
  type?: "section";
  curto?: string;
  modulo?: Modulo;
};

export const MENU_ITEMS: MenuItem[] = [
  { label: "Início", icon: "home", route: "home" },
  { label: "Eventos", icon: "event", route: "eventos", modulo: "igreja" },
  { label: "BI", icon: "dashboard", route: "bi", modulo: "igreja" },
  { label: "FINANCEIRO", type: "section", modulo: "igreja" },
  {
    label: "Contas Bancárias",
    icon: "account_balance",
    route: "financeiro.contas-bancarias",
    modulo: "igreja",
  },
  { label: "Cobranças", icon: "receipt_long", route: "financeiro.cobrancas", modulo: "igreja" },
  { label: "Pagamentos", icon: "payments", route: "financeiro.pagamentos", modulo: "igreja" },
  { label: "IMÓVEIS", type: "section", modulo: "imoveis" },
  { label: "Painel", icon: "space_dashboard", route: "imoveis.painel", modulo: "imoveis" },
  { label: "Proprietários", icon: "badge", route: "imoveis.proprietarios", modulo: "imoveis" },
  { label: "Imóveis", icon: "apartment", route: "imoveis.imoveis", modulo: "imoveis" },
  { label: "Contratos", icon: "description", route: "imoveis.contratos", modulo: "imoveis" },
  { label: "Inquilinos", icon: "people", route: "imoveis.inquilinos", modulo: "imoveis" },
  { label: "ADMINISTRAÇÃO", type: "section" },
  { label: "Minha Empresa", icon: "business", route: "empresa" },
  { label: "Membros", icon: "diversity_3", route: "membros", modulo: "igreja" },
  { label: "Apriscos", icon: "holiday_village", route: "apriscos", modulo: "igreja" },
  { label: "Usuários", icon: "group", route: "usuarios" },
  { label: "Notificações", icon: "email", route: "notificacao" },
];

function itemVisivel(
  item: MenuItem,
  modulos: string[],
  isAdmin: boolean,
  isInterno: boolean,
): boolean {
  if (item.modulo === "imoveis") return modulos.includes("imoveis") && isInterno;
  if (item.modulo === "igreja") return modulos.includes("igreja") && isAdmin;
  return isAdmin || item.route === "home";
}

/** Filtra o menu pelos módulos da empresa e pelo perfil. Seções sem itens visíveis somem. */
export function filtrarMenu(
  itens: MenuItem[],
  modulos: string[],
  isAdmin: boolean,
  isInterno: boolean,
): MenuItem[] {
  const resultado: MenuItem[] = [];
  let secao: MenuItem | null = null;
  let secaoEmitida = false;
  for (const item of itens) {
    if (item.type === "section") {
      secao = item;
      secaoEmitida = false;
      continue;
    }
    if (!itemVisivel(item, modulos, isAdmin, isInterno)) continue;
    if (secao && !secaoEmitida) {
      resultado.push(secao);
      secaoEmitida = true;
    }
    resultado.push(item);
  }
  return resultado;
}
