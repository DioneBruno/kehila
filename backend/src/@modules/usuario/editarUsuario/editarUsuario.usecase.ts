import { ApiError } from "src/@modules/shared/apiError";
import { listaTexto, texto, textoLimpavel } from "src/@modules/shared/apiTexto";
import { ApiValidate } from "src/@modules/shared/apiValidate";
import { garantirNaoEhUltimoAdmin } from "../ultimoAdmin";
import { EditarUsuarioRepository, UsuarioMeta } from "./editarUsuarioRepository";

export type EditarUsuarioInput = {
  companyUuid: string;
  usuarioUuid: string;
  name?: string;
  /** null (ou vazio) limpa o campo; undefined não altera. */
  cpf?: string | null;
  email?: string | null;
  phone?: string | null;
  cep?: string;
  endereco?: string;
  enderecoNumero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  estadoCivil?: string;
  dataNascimento?: string;
  meta?: UsuarioMeta;
  password?: string;
  position?: string;
  roles?: string[];
  isAccepted?: boolean;
  /** Só o Admin passa true: permite alterar dados de acesso de quem pertence a outras igrejas. */
  permitirAlterarAcessoCompartilhado?: boolean;
};

const ESTADOS_CIVIS = ["solteiro", "casado", "divorciado", "separado", "viuvo", "uniao"];

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const d = new Date(`${data}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().startsWith(data) && d <= new Date();
}

export class EditarUsuarioUsecase {
  constructor(readonly repo: EditarUsuarioRepository) {}

  async execute(input: EditarUsuarioInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.usuarioUuid) throw new ApiError("Usuário não identificado");
    const name = texto(input.name, "name");
    const cpf = textoLimpavel(input.cpf, "cpf");
    const email = textoLimpavel(input.email, "email");
    const phone = textoLimpavel(input.phone, "phone");
    const cep = texto(input.cep, "cep");
    const endereco = texto(input.endereco, "endereco");
    const enderecoNumero = texto(input.enderecoNumero, "enderecoNumero");
    const bairro = texto(input.bairro, "bairro");
    const cidade = texto(input.cidade, "cidade");
    const uf = texto(input.uf, "uf");
    const estadoCivil = texto(input.estadoCivil, "estadoCivil");
    const dataNascimento = texto(input.dataNascimento, "dataNascimento");
    const password = texto(input.password, "password") || undefined;
    const position = texto(input.position, "position");
    const roles = listaTexto(input.roles, "roles");
    if (input.isAccepted !== undefined && typeof input.isAccepted !== "boolean") throw new ApiError("Campo isAccepted inválido");
    const isAccepted = input.isAccepted;

    if (name !== undefined && !name.trim()) throw new ApiError("O nome do usuário é obrigatório");
    if (cpf && !ApiValidate.validateCpf(cpf)) throw new ApiError("CPF inválido");
    if (email && !ApiValidate.validateEmail(email)) throw new ApiError("E-mail inválido");
    if (uf && uf.trim().length !== 2) throw new ApiError("UF inválida");
    if (estadoCivil && !ESTADOS_CIVIS.includes(estadoCivil)) throw new ApiError("Estado civil inválido");
    if (dataNascimento && !dataValida(dataNascimento)) throw new ApiError("Data de nascimento inválida");

    const existe = await this.repo.existe(input.companyUuid, input.usuarioUuid);
    if (!existe) throw new ApiError("Usuário não encontrado", 404);

    const removeAdmin = (position !== undefined && position !== "admin") || isAccepted === false;
    if (removeAdmin) await garantirNaoEhUltimoAdmin(this.repo, input.companyUuid, input.usuarioUuid);

    const [atual] =
      cpf !== undefined || email !== undefined || phone !== undefined ? await this.repo.dadosDeAcesso(input.usuarioUuid) : [undefined];

    if ((cpf !== undefined || email !== undefined) && !(cpf !== undefined ? cpf : atual?.cpf) && !(email !== undefined ? email : atual?.email)) {
      throw new ApiError("Informe o CPF ou o e-mail do usuário");
    }

    // Dados de acesso (senha, e-mail, CPF, telefone) valem para todas as igrejas do usuário.
    // Se ele também pertence a outra igreja, um admin desta não pode alterá-los (evita tomar a conta em outra igreja).
    const alteraDadosDeAcesso = !!password || cpf !== undefined || email !== undefined || phone !== undefined;
    if (
      !input.permitirAlterarAcessoCompartilhado &&
      alteraDadosDeAcesso &&
      (await this.repo.vinculadoAOutrasEmpresas(input.companyUuid, input.usuarioUuid))
    ) {
      const mudou =
        !!password ||
        (email !== undefined && email !== (atual?.email ?? null)) ||
        (cpf !== undefined && cpf !== (atual?.cpf ?? null)) ||
        (phone !== undefined && phone !== (atual?.phone ?? null));
      if (mudou) {
        throw new ApiError(
          "Este usuário também pertence a outra igreja; senha, e-mail, CPF e telefone só podem ser alterados pelo próprio usuário.",
          403,
        );
      }
    }

    await this.repo.atualizar(input.companyUuid, input.usuarioUuid, {
      name: name?.trim(),
      cpf,
      email,
      phone,
      cep: cep?.replace(/\D/g, ""),
      endereco: endereco?.trim(),
      enderecoNumero: enderecoNumero?.trim(),
      bairro: bairro?.trim(),
      cidade: cidade?.trim(),
      uf: uf?.trim().toUpperCase(),
      estadoCivil,
      dataNascimento,
      meta: input.meta
        ? {
            ...(input.meta.batizado !== undefined && { batizado: !!input.meta.batizado }),
            ...(input.meta.outraIgreja !== undefined && { outraIgreja: !!input.meta.outraIgreja }),
          }
        : undefined,
      password,
      position,
      roles,
      isAccepted,
    });
  }
}
