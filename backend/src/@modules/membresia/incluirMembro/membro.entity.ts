import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";

export type MembroProps = {
  uuid: string;
  companyUuid: string;
  nome: string;
  ativo: boolean;
  membro: boolean;
  batizado: boolean;
  transferido: boolean;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  estadoCivil?: string | null;
  dataNascimento?: string | null;
  enderecoCep?: string | null;
  enderecoLogradouro?: string | null;
  enderecoNumero?: string | null;
  enderecoComplemento?: string | null;
  enderecoBairro?: string | null;
  enderecoCidade?: string | null;
  enderecoUf?: string | null;
  meta: Record<string, any>;
};

export type CriarMembroProps = Omit<MembroProps, "uuid" | "ativo" | "membro" | "batizado" | "transferido" | "meta"> &
  Partial<Pick<MembroProps, "ativo" | "membro" | "batizado" | "transferido" | "meta">>;

export class MembroEntity {
  constructor(readonly props: MembroProps) {}

  static criar(input: CriarMembroProps): MembroEntity {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.nome?.trim()) throw new ApiError("O nome do membro é obrigatório");

    return new MembroEntity({
      ...input,
      uuid: randomUUID(),
      nome: input.nome.trim(),
      ativo: input.ativo ?? true,
      membro: input.membro ?? true,
      batizado: input.batizado ?? false,
      transferido: input.transferido ?? false,
      meta: input.meta ?? {},
    });
  }

  get uuid() {
    return this.props.uuid;
  }
}
