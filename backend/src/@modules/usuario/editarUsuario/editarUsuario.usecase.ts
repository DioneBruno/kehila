import { ApiError } from "src/@modules/shared/apiError";
import { ApiValidate } from "src/@modules/shared/apiValidate";
import { EditarUsuarioRepository, UsuarioMeta } from "./editarUsuarioRepository";

export type EditarUsuarioInput = {
  companyUuid: string;
  usuarioUuid: string;
  name?: string;
  cpf?: string;
  email?: string;
  phone?: string;
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
    if (input.name !== undefined && !input.name.trim()) throw new ApiError("O nome do usuário é obrigatório");
    if (input.cpf && !ApiValidate.validateCpf(input.cpf)) throw new ApiError("CPF inválido");
    if (input.email && !ApiValidate.validateEmail(input.email)) throw new ApiError("E-mail inválido");
    if (input.uf && input.uf.trim().length !== 2) throw new ApiError("UF inválida");
    if (input.estadoCivil && !ESTADOS_CIVIS.includes(input.estadoCivil)) throw new ApiError("Estado civil inválido");
    if (input.dataNascimento && !dataValida(input.dataNascimento)) throw new ApiError("Data de nascimento inválida");

    const existe = await this.repo.existe(input.companyUuid, input.usuarioUuid);
    if (!existe) throw new ApiError("Usuário não encontrado", 404);

    await this.repo.atualizar(input.companyUuid, input.usuarioUuid, {
      name: input.name?.trim(),
      cpf: input.cpf?.trim(),
      email: input.email?.trim(),
      phone: input.phone,
      cep: input.cep?.replace(/\D/g, ""),
      endereco: input.endereco?.trim(),
      enderecoNumero: input.enderecoNumero?.trim(),
      bairro: input.bairro?.trim(),
      cidade: input.cidade?.trim(),
      uf: input.uf?.trim().toUpperCase(),
      estadoCivil: input.estadoCivil,
      dataNascimento: input.dataNascimento,
      meta: input.meta
        ? {
            ...(input.meta.batizado !== undefined && { batizado: !!input.meta.batizado }),
            ...(input.meta.outraIgreja !== undefined && { outraIgreja: !!input.meta.outraIgreja }),
          }
        : undefined,
      password: input.password,
      position: input.position,
      roles: input.roles,
      isAccepted: input.isAccepted,
    });
  }
}
