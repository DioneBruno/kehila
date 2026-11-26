import { randomUUID } from "crypto";
import * as bcryptjs from "bcryptjs";
import { garantirDominioLivre, normalizarDominio, DominioRegrasRepository } from "src/@modules/empresa/dominio/dominioRegras";
import { validarModulos } from "src/@modules/empresa/modulos/modulos";
import { ApiError } from "src/@modules/shared/apiError";
import { texto } from "src/@modules/shared/apiTexto";
import { ApiValidate } from "src/@modules/shared/apiValidate";
import { CadastrarEmpresaRepository } from "./cadastrarEmpresaRepository";

export type CadastrarEmpresaInput = {
  empresa?: {
    name?: string;
    cpfCnpj?: string;
    commercialName?: string;
    fantasyName?: string;
    stateRegistration?: string;
    email?: string;
    phone?: string;
    uf?: string;
    address?: Record<string, unknown>;
  };
  dominio?: string;
  modulos?: unknown;
  admin?: { name?: string; email?: string; cpf?: string; phone?: string; password?: string };
};

const aparar = (valor: unknown, campo: string): string | null => texto(valor, campo)?.trim() || null;

export class CadastrarEmpresaUsecase {
  constructor(
    readonly repo: CadastrarEmpresaRepository,
    readonly regras: DominioRegrasRepository,
  ) {}

  async execute(input: CadastrarEmpresaInput): Promise<{ uuid: string; adminUuid: string }> {
    const emp = input.empresa ?? {};
    const name = texto(emp.name, "empresa.name")?.trim();
    const cpfCnpj = texto(emp.cpfCnpj, "empresa.cpfCnpj")?.trim();
    if (!name) throw new ApiError("O nome da empresa é obrigatório");
    if (!cpfCnpj) throw new ApiError("O CPF/CNPJ é obrigatório");

    const dominio = normalizarDominio(input.dominio);
    await garantirDominioLivre(this.regras, dominio);

    const modulos = validarModulos(input.modulos);

    const adm = input.admin ?? {};
    const adminName = texto(adm.name, "admin.name")?.trim();
    const cpf = aparar(adm.cpf, "admin.cpf");
    const email = aparar(adm.email, "admin.email");
    const adminPhone = aparar(adm.phone, "admin.phone");
    if (!adminName) throw new ApiError("O nome do usuário é obrigatório");
    if (!cpf && !email) throw new ApiError("Informe o CPF ou o e-mail do usuário");
    if (cpf && !ApiValidate.validateCpf(cpf)) throw new ApiError("CPF inválido");
    if (email && !ApiValidate.validateEmail(email)) throw new ApiError("E-mail inválido");
    if (typeof adm.password !== "string" || adm.password.length < 8) throw new ApiError("A senha deve ter pelo menos 8 caracteres");

    const uuid = randomUUID();
    const adminUuid = randomUUID();
    const passwordHash = await bcryptjs.hash(adm.password, 10);

    await this.repo.cadastrar({
      uuid,
      adminUuid,
      empresa: {
        name,
        cpfCnpj,
        commercialName: aparar(emp.commercialName, "empresa.commercialName"),
        fantasyName: aparar(emp.fantasyName, "empresa.fantasyName"),
        stateRegistration: aparar(emp.stateRegistration, "empresa.stateRegistration"),
        email: aparar(emp.email, "empresa.email"),
        phone: aparar(emp.phone, "empresa.phone"),
        uf: aparar(emp.uf, "empresa.uf"),
        address: emp.address ?? null,
      },
      dominio,
      modulos,
      admin: {
        name: adminName,
        ...(email ? { email } : {}),
        ...(cpf ? { cpf } : {}),
        ...(adminPhone ? { phone: adminPhone } : {}),
        passwordHash,
      },
    });
    return { uuid, adminUuid };
  }
}
