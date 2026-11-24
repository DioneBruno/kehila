import { useQuasar } from "quasar";
import type {
  ContratoStatus,
  GarantiaTipo,
  IndiceReajuste,
} from "src/@modules/imoveis/contrato.http";
import type {
  ImovelHttp,
  ImovelInput,
  ImovelSituacao,
  ListarImoveisFiltro,
} from "src/@modules/imoveis/imovel.http";
import type {
  ListarPessoasFiltro,
  PessoaHttp,
  PessoaInput,
  PessoaPapel,
  PessoaTipo,
} from "src/@modules/imoveis/pessoa.http";
import { MessageConfirmationService } from "src/shared/message.service";
import { inject } from "vue";
import { useRouter } from "vue-router";

type Opcao<T extends string> = { value: T; label: string; color?: string };

export const PESSOA_TIPOS: Opcao<PessoaTipo>[] = [
  { value: "PF", label: "Pessoa física" },
  { value: "PJ", label: "Pessoa jurídica" },
];

export const PAPEIS: Opcao<PessoaPapel>[] = [
  { value: "proprietario", label: "Proprietário" },
  { value: "inquilino", label: "Inquilino" },
  { value: "fiador", label: "Fiador" },
];

export const IMOVEL_TIPOS: Opcao<
  "casa" | "apartamento" | "sala_comercial" | "loja" | "galpao" | "terreno" | "outro"
>[] = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "sala_comercial", label: "Sala comercial" },
  { value: "loja", label: "Loja" },
  { value: "galpao", label: "Galpão" },
  { value: "terreno", label: "Terreno" },
  { value: "outro", label: "Outro" },
];

export const IMOVEL_FINALIDADES: Opcao<"residencial" | "comercial">[] = [
  { value: "residencial", label: "Residencial" },
  { value: "comercial", label: "Comercial" },
];

export const IMOVEL_SITUACOES: Opcao<ImovelSituacao>[] = [
  { value: "livre", label: "Livre", color: "positive" },
  { value: "alugado", label: "Alugado", color: "primary" },
  { value: "reforma", label: "Em reforma", color: "orange-8" },
  { value: "inativo", label: "Inativo", color: "grey-6" },
];

export const INDICES_REAJUSTE: Opcao<IndiceReajuste>[] = [
  { value: "IGPM", label: "IGP-M" },
  { value: "IPCA", label: "IPCA" },
  { value: "INPC", label: "INPC" },
  { value: "IGPDI", label: "IGP-DI" },
  { value: "nenhum", label: "Sem reajuste" },
];

export const GARANTIA_TIPOS: Opcao<GarantiaTipo>[] = [
  { value: "fiador", label: "Fiador" },
  { value: "caucao", label: "Caução" },
  { value: "seguro_fianca", label: "Seguro fiança" },
  { value: "titulo_capitalizacao", label: "Título de capitalização" },
  { value: "nenhuma", label: "Nenhuma" },
];

export const CONTRATO_STATUS: Opcao<ContratoStatus>[] = [
  { value: "vigente", label: "Vigente", color: "positive" },
  { value: "encerrado", label: "Encerrado", color: "grey-6" },
  { value: "rescindido", label: "Rescindido", color: "negative" },
];

function rotulo<T extends string>(opcoes: Opcao<T>[], valor: T | null | undefined) {
  return opcoes.find((o) => o.value === valor)?.label ?? valor ?? "";
}
function cor<T extends string>(opcoes: Opcao<T>[], valor: T | null | undefined) {
  return opcoes.find((o) => o.value === valor)?.color ?? "grey-6";
}

export const labelPessoaTipo = (v: PessoaTipo) => rotulo(PESSOA_TIPOS, v);
export const labelImovelTipo = (v: string) => rotulo(IMOVEL_TIPOS, v as never);
export const labelFinalidade = (v: string) => rotulo(IMOVEL_FINALIDADES, v as never);
export const labelSituacao = (v: ImovelSituacao) => rotulo(IMOVEL_SITUACOES, v);
export const corSituacao = (v: ImovelSituacao) => cor(IMOVEL_SITUACOES, v);
export const labelIndice = (v: IndiceReajuste) => rotulo(INDICES_REAJUSTE, v);
export const labelGarantia = (v: GarantiaTipo) => rotulo(GARANTIA_TIPOS, v);
export const labelStatus = (v: ContratoStatus) => rotulo(CONTRATO_STATUS, v);
export const corStatus = (v: ContratoStatus) => cor(CONTRATO_STATUS, v);

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarMoeda(valor: number | null | undefined) {
  return valor === null || valor === undefined ? "-" : brl.format(valor);
}

/** "2026-03-31" -> "31/03/2026" (sem passar por Date, para não deslocar o dia pelo fuso). */
export function formatarData(iso: string | null | undefined) {
  if (!iso) return "-";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** CPF (11 dígitos) ou CNPJ (14) mascarado; outros tamanhos voltam como vieram. */
export function formatarDocumento(valor: string | null | undefined) {
  if (!valor) return "";
  const d = valor.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return valor;
}

export function formatarTelefone(valor: string | null | undefined) {
  if (!valor) return "";
  const d = valor.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return valor;
}

export function enderecoEmLinha(e: {
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
}) {
  const rua = [e.enderecoLogradouro, e.enderecoNumero].filter(Boolean).join(", ");
  const cidade = [e.enderecoCidade, e.enderecoUf].filter(Boolean).join("/");
  return [rua, e.enderecoBairro, cidade].filter(Boolean).join(" - ");
}

/** Rota do módulo de contratos (Task 9) só existe depois que ela for registrada. */
export function rotaExiste(router: ReturnType<typeof useRouter>, name: string) {
  return router.hasRoute(name);
}

export class ImoveisService {
  private $pessoaHttp = inject("pessoaHttp") as PessoaHttp;
  private $imovelHttp = inject("imovelHttp") as ImovelHttp;
  private $q = useQuasar();
  private $router = useRouter();
  private $confirmacao = new MessageConfirmationService();

  // Erros de requisição já são notificados pelo interceptor do axios: aqui só devolvemos null/false.

  async listarPessoas(filtro: ListarPessoasFiltro) {
    try {
      const response = await this.$pessoaHttp.listar(filtro);
      return { itens: response.data, total: response.meta?.total ?? response.data.length };
    } catch {
      return null;
    }
  }

  async buscarPessoa(uuid: string) {
    try {
      this.$q.loading.show();
      return (await this.$pessoaHttp.buscarPorUuid(uuid)).data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async incluirPessoa(input: PessoaInput, opcoes: { redirecionar?: boolean } = {}) {
    try {
      this.$q.loading.show();
      const response = await this.$pessoaHttp.incluir(input);
      this.$q.notify({ type: "positive", message: "Pessoa cadastrada" });
      if (opcoes.redirecionar ?? true) {
        void this.$router.push({
          name: "imoveis.pessoas.detalhe",
          params: { uuid: response.data.uuid },
        });
      }
      return response.data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async alterarPessoa(uuid: string, input: Partial<Omit<PessoaInput, "tipo">>) {
    try {
      this.$q.loading.show();
      await this.$pessoaHttp.alterar(uuid, input);
      this.$q.notify({ type: "positive", message: "Alterações salvas" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async deletarPessoa(uuid: string, voltarPara: string) {
    if (!(await this.$confirmacao.execute("Excluir esta pessoa? Esta ação não pode ser desfeita.")))
      return false;
    try {
      this.$q.loading.show();
      await this.$pessoaHttp.deletar(uuid);
      this.$q.notify({ type: "positive", message: "Pessoa excluída" });
      void this.$router.push({ name: voltarPara });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async listarImoveis(filtro: ListarImoveisFiltro) {
    try {
      const response = await this.$imovelHttp.listar(filtro);
      return { itens: response.data, total: response.meta?.total ?? response.data.length };
    } catch {
      return null;
    }
  }

  async buscarImovel(uuid: string) {
    try {
      this.$q.loading.show();
      return (await this.$imovelHttp.buscarPorUuid(uuid)).data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async incluirImovel(input: Omit<ImovelInput, "situacao">) {
    try {
      this.$q.loading.show();
      const response = await this.$imovelHttp.incluir(input);
      this.$q.notify({ type: "positive", message: "Imóvel cadastrado" });
      void this.$router.push({
        name: "imoveis.imoveis.detalhe",
        params: { uuid: response.data.uuid },
      });
      return response.data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async alterarImovel(uuid: string, input: Partial<ImovelInput>) {
    try {
      this.$q.loading.show();
      await this.$imovelHttp.alterar(uuid, input);
      this.$q.notify({ type: "positive", message: "Alterações salvas" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async deletarImovel(uuid: string) {
    if (!(await this.$confirmacao.execute("Excluir este imóvel? Esta ação não pode ser desfeita.")))
      return false;
    try {
      this.$q.loading.show();
      await this.$imovelHttp.deletar(uuid);
      this.$q.notify({ type: "positive", message: "Imóvel excluído" });
      void this.$router.push({ name: "imoveis.imoveis" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }
}
