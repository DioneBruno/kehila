import { createInterface } from "readline";
import { Writable } from "stream";
import dataSource from "src/@infra/database/datasource";
import { CadastrarEmpresaUsecase } from "src/@modules/admin/cadastrarEmpresa/cadastrarEmpresa.usecase";
import { CadastrarEmpresaRepository } from "src/@modules/admin/cadastrarEmpresa/cadastrarEmpresaRepository";
import { DominioRegrasRepository } from "src/@modules/empresa/dominio/dominioRegras";
import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

const USO = "Uso: admin:criar --dominio <origem> --email <email> [--nome <nome>] [--empresa <nome>] [--cnpj <cnpj>]  (senha em ADMIN_SENHA ou perguntada)";

export type CriarEmpresaAdminArgs = { dominio: string; email: string; nome: string; empresa: string; cnpj: string };

export function lerArgumentos(argv: string[]): CriarEmpresaAdminArgs {
  const valores: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith("--")) continue;
    const igual = item.indexOf("=");
    if (igual > -1) valores[item.slice(2, igual)] = item.slice(igual + 1);
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) valores[item.slice(2)] = argv[++i];
  }
  if (!valores.dominio || !valores.email) throw new Error(USO);
  return {
    dominio: valores.dominio,
    email: valores.email,
    nome: valores.nome || "Administrador",
    empresa: valores.empresa || "empresa-admin",
    cnpj: valores.cnpj || "00000000000000",
  };
}

export type CriarEmpresaAdminDeps = {
  usecase: Pick<CadastrarEmpresaUsecase, "execute">;
  repo: Pick<CadastrarEmpresaRepository, "existeEmpresaComModulo">;
  senha: string;
  log: (mensagem: string) => void;
};

export async function executarCriarEmpresaAdmin(deps: CriarEmpresaAdminDeps, args: CriarEmpresaAdminArgs): Promise<"criada" | "ja-existe"> {
  if (await deps.repo.existeEmpresaComModulo("admin")) {
    deps.log("Já existe uma empresa com o módulo admin; nada foi gravado.");
    return "ja-existe";
  }
  await deps.usecase.execute({
    empresa: { name: args.empresa, cpfCnpj: args.cnpj },
    dominio: args.dominio,
    modulos: ["admin"],
    admin: { name: args.nome, email: args.email, password: deps.senha },
  });
  deps.log(`Empresa admin criada. Acesse ${args.dominio}`);
  return "criada";
}

function perguntarSenha(): Promise<string> {
  const mudo = new Writable({ write: (_c, _e, cb) => cb() });
  const rl = createInterface({ input: process.stdin, output: mudo, terminal: true });
  process.stdout.write("Senha do administrador: ");
  return new Promise((resolve) =>
    rl.question("", (resposta) => {
      rl.close();
      process.stdout.write("\n");
      resolve(resposta);
    }),
  );
}

async function main() {
  let args: CriarEmpresaAdminArgs;
  try {
    args = lerArgumentos(process.argv.slice(2));
  } catch (erro) {
    console.error((erro as Error).message);
    process.exitCode = 1;
    return;
  }
  await dataSource.initialize();
  try {
    const senha = process.env.ADMIN_SENHA || (await perguntarSenha());
    const hub = new ConnectionHub({ database: dataSource });
    const repo = new CadastrarEmpresaRepository(hub);
    const usecase = new CadastrarEmpresaUsecase(repo, new DominioRegrasRepository(hub));
    await executarCriarEmpresaAdmin({ usecase, repo, senha, log: console.log }, args);
  } catch (erro) {
    if (erro instanceof ApiError) {
      console.error(erro.message);
      process.exitCode = 1;
    } else throw erro;
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  main().catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
}
