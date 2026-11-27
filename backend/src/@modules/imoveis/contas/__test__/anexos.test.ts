import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirContaRepository } from "../incluirConta/incluirContaRepository";
import { IncluirContaUsecase } from "../incluirConta/incluirConta.usecase";
import { AnexosContaRepository, EnviarAnexoContaUsecase, RemoverAnexoContaUsecase, UrlAnexoContaUsecase, validarArquivoAnexo } from "../anexos/anexosConta";
import { MSG_ANEXO_NAO_ENCONTRADO, MSG_ARQUIVO_GRANDE, MSG_CONTA_NAO_ENCONTRADA, MSG_ENVIE_ARQUIVO, MSG_FORMATO_ANEXO, MSG_TIPO_ANEXO_INVALIDO } from "../conta.entity";

const EMPRESA = "11111111-1111-4111-8111-111111111111";
const CONTA = "22222222-2222-4222-8222-222222222222";
const ANEXO = "33333333-3333-4333-8333-333333333333";
const PDF = Buffer.from("%PDF-1.4 conteudo");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);

const montar = (opts: { contaExiste?: boolean; anexo?: any } = {}) => {
  const repo = {
    contaExiste: jest.fn(async () => opts.contaExiste ?? true),
    inserir: jest.fn(async () => undefined),
    buscar: jest.fn(async () => opts.anexo ?? null),
    remover: jest.fn(async () => (opts.anexo ? true : false)),
  };
  const storage = {
    upload: jest.fn(async (path: string) => ({ path })),
    generatePresignerUrl: jest.fn(async (path: string) => `url-fake:${path}`),
    download: jest.fn(),
  };
  return { repo, storage };
};

const enviar = (m: ReturnType<typeof montar>, over: Record<string, unknown> = {}) =>
  new EnviarAnexoContaUsecase(m.repo as any, m.storage as any).execute({
    companyUuid: EMPRESA,
    contaUuid: CONTA,
    tipo: "documento",
    buffer: PDF,
    nomeArquivo: "x.pdf",
    ...over,
  } as any);

describe("validarArquivoAnexo", () => {
  it.each([
    [PDF, "application/pdf", "pdf"],
    [PNG, "image/png", "png"],
    [JPG, "image/jpeg", "jpg"],
  ])("reconhece pelos bytes", (b, tipo, ext) => {
    expect(validarArquivoAnexo(b)).toEqual({ tipo, ext });
  });
  it("rejeita vazio", () => {
    expect(() => validarArquivoAnexo(Buffer.alloc(0))).toThrow(expect.objectContaining({ message: MSG_ENVIE_ARQUIVO, statusCode: 400 }));
  });
});

describe("EnviarAnexoContaUsecase", () => {
  it("envia PDF e grava registro com caminho da empresa e da conta", async () => {
    const m = montar();
    const r = await enviar(m, { nomeArquivo: "  boleto.pdf " });
    const [caminho, , ct] = m.storage.upload.mock.calls[0] as unknown as [string, Buffer, string];
    expect(caminho).toBe(`empresas/${EMPRESA}/imoveis/contas/${CONTA}/${r.uuid}.pdf`);
    expect(ct).toBe("application/pdf");
    expect(m.repo.inserir).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: r.uuid,
        companyUuid: EMPRESA,
        contaUuid: CONTA,
        tipo: "documento",
        nomeArquivo: "boleto.pdf",
        caminho,
        contentType: "application/pdf",
        tamanho: PDF.length,
      }),
    );
  });

  it("usa nome padrão quando vazio e limita a 255", async () => {
    const m = montar();
    await enviar(m, { tipo: "comprovante", buffer: PNG, nomeArquivo: "  " });
    await enviar(m, { tipo: "comprovante", buffer: PNG, nomeArquivo: "a".repeat(300) });
    expect((m.repo.inserir.mock.calls[0] as any)[0].nomeArquivo).toBe("anexo.png");
    expect((m.repo.inserir.mock.calls[1] as any)[0].nomeArquivo).toHaveLength(255);
  });

  it("rejeita bytes de texto com extensão .pdf", async () => {
    const m = montar();
    await expect(enviar(m, { buffer: Buffer.from("texto") })).rejects.toMatchObject({ message: MSG_FORMATO_ANEXO, statusCode: 400 });
    expect(m.storage.upload).not.toHaveBeenCalled();
  });

  it("rejeita 10 MB + 1", async () => {
    const m = montar();
    const grande = Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024 + 1 - PDF.length)]);
    await expect(enviar(m, { buffer: grande })).rejects.toMatchObject({ message: MSG_ARQUIVO_GRANDE, statusCode: 400 });
    expect(m.storage.upload).not.toHaveBeenCalled();
  });

  it("rejeita tipo de anexo inválido", async () => {
    await expect(enviar(montar(), { tipo: "foto" })).rejects.toMatchObject({ message: MSG_TIPO_ANEXO_INVALIDO, statusCode: 400 });
  });

  it("conta de outra empresa -> 404 e não envia ao storage", async () => {
    const m = montar({ contaExiste: false });
    await expect(enviar(m)).rejects.toMatchObject({ message: MSG_CONTA_NAO_ENCONTRADA, statusCode: 404 });
    expect(m.storage.upload).not.toHaveBeenCalled();
    expect(m.repo.inserir).not.toHaveBeenCalled();
  });

  it("uuid malformado -> 404", async () => {
    await expect(enviar(montar(), { contaUuid: "x" })).rejects.toMatchObject({ message: MSG_CONTA_NAO_ENCONTRADA, statusCode: 404 });
  });
});

describe("UrlAnexoContaUsecase", () => {
  it("devolve URL assinada de 300s e o nome", async () => {
    const m = montar({ anexo: { caminho: "p/a.pdf", nomeArquivo: "a.pdf" } });
    const r = await new UrlAnexoContaUsecase(m.repo as any, m.storage as any).execute({ companyUuid: EMPRESA, contaUuid: CONTA, anexoUuid: ANEXO });
    expect(r).toEqual({ url: "url-fake:p/a.pdf", nomeArquivo: "a.pdf" });
    expect(m.storage.generatePresignerUrl).toHaveBeenCalledWith("p/a.pdf", 300);
  });

  it("url de anexo removido -> 404", async () => {
    const m = montar();
    await expect(new UrlAnexoContaUsecase(m.repo as any, m.storage as any).execute({ companyUuid: EMPRESA, contaUuid: CONTA, anexoUuid: ANEXO })).rejects.toMatchObject({
      message: MSG_ANEXO_NAO_ENCONTRADO,
      statusCode: 404,
    });
  });
});

describe("RemoverAnexoContaUsecase", () => {
  const rem = (m: ReturnType<typeof montar>, over: Record<string, unknown> = {}) =>
    new RemoverAnexoContaUsecase(m.repo as any).execute({ companyUuid: EMPRESA, contaUuid: CONTA, anexoUuid: ANEXO, ...over });

  it("404 se não existe nessa conta", async () => {
    await expect(rem(montar())).rejects.toMatchObject({ message: MSG_ANEXO_NAO_ENCONTRADO, statusCode: 404 });
  });
  it("remove se existe", async () => {
    await expect(rem(montar({ anexo: {} }))).resolves.toBeUndefined();
  });
  it("uuid de conta malformado -> 404 da conta", async () => {
    await expect(rem(montar(), { contaUuid: "x" })).rejects.toMatchObject({ message: MSG_CONTA_NAO_ENCONTRADA });
  });
});

describe("AnexosContaRepository (banco real)", () => {
  const empresa = "b0a80000-0000-4000-8000-0000000005a1";
  const outraEmpresa = "b0a80000-0000-4000-8000-0000000005b1";
  const pessoaUuid = "b0a80000-0000-4000-8000-0000000005c1";
  let repo: AnexosContaRepository;
  let incluir: IncluirContaUsecase;

  const limpar = async () => {
    for (const t of ["imovel_conta_anexos", "imovel_contas", "imovel_pessoas"]) {
      await dataSource.query(`DELETE FROM ${t} WHERE company_uuid IN ($1, $2)`, [empresa, outraEmpresa]);
    }
  };
  const novaConta = async (company = empresa) => {
    const { uuid } = await incluir.execute({ companyUuid: company, hoje: "2026-11-24", tipo: "encargo", categoria: "iptu", vencimento: "2026-12-10", valor: 100, proprietarioUuid: pessoaUuid } as any);
    return uuid;
  };

  beforeAll(async () => {
    await dataSource.initialize();
    for (const [id, tenant] of [
      [empresa, "test-anexos-a"],
      [outraEmpresa, "test-anexos-b"],
    ]) {
      await dataSource.query(`INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj) VALUES ($1, $2, 'Empresa Teste Anexos', '00000000000000') ON CONFLICT DO NOTHING`, [id, tenant]);
    }
    const hub = new ConnectionHub({ database: dataSource });
    repo = new AnexosContaRepository(hub);
    incluir = new IncluirContaUsecase(new IncluirContaRepository(hub));
  });
  beforeEach(async () => {
    await limpar();
    await dataSource.query(
      `INSERT INTO imovel_pessoas (uuid, company_uuid, tipo, documento, nome, eh_proprietario) VALUES ($1, $2, 'PF', '29999999901', 'Dono', true)`,
      [pessoaUuid, empresa],
    );
  });
  afterAll(async () => {
    await limpar();
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid IN ($1, $2)`, [empresa, outraEmpresa]);
    await dataSource.destroy();
  });

  const registro = (contaUuid: string, over: Record<string, unknown> = {}) => ({
    uuid: "b0a80000-0000-4000-8000-0000000005d1",
    companyUuid: empresa,
    contaUuid,
    tipo: "documento" as const,
    nomeArquivo: "a.pdf",
    caminho: "empresas/x/a.pdf",
    contentType: "application/pdf",
    tamanho: 10,
    ...over,
  });

  it("contaExiste respeita empresa", async () => {
    const conta = await novaConta();
    expect(await repo.contaExiste(empresa, conta)).toBe(true);
    expect(await repo.contaExiste(outraEmpresa, conta)).toBe(false);
  });

  it("insere e busca; empresa ou conta erradas -> null", async () => {
    const conta = await novaConta();
    const outraConta = await novaConta();
    const r = registro(conta);
    await repo.inserir(r);
    expect(await repo.buscar(empresa, conta, r.uuid)).toEqual({ caminho: r.caminho, nomeArquivo: "a.pdf" });
    expect(await repo.buscar(outraEmpresa, conta, r.uuid)).toBeNull();
    expect(await repo.buscar(empresa, outraConta, r.uuid)).toBeNull();
  });

  it("remover devolve true uma vez e false depois; buscar fica null", async () => {
    const conta = await novaConta();
    const r = registro(conta);
    await repo.inserir(r);
    expect(await repo.remover(outraEmpresa, conta, r.uuid)).toBe(false);
    expect(await repo.remover(empresa, conta, r.uuid)).toBe(true);
    expect(await repo.remover(empresa, conta, r.uuid)).toBe(false);
    expect(await repo.buscar(empresa, conta, r.uuid)).toBeNull();
  });

  it("CHECK da tabela rejeita tipo inválido", async () => {
    const conta = await novaConta();
    await expect(repo.inserir(registro(conta, { tipo: "foto" }))).rejects.toThrow();
  });

  it("fluxo completo: enviar -> url -> remover -> url 404, com storage falso", async () => {
    const conta = await novaConta();
    const storage = { upload: jest.fn(async (p: string) => ({ path: p })), generatePresignerUrl: jest.fn(async (p: string) => `url-fake:${p}`), download: jest.fn() };
    const { uuid } = await new EnviarAnexoContaUsecase(repo, storage as any).execute({ companyUuid: empresa, contaUuid: conta, tipo: "comprovante", buffer: PNG, nomeArquivo: "foto.png" });
    const [row] = await dataSource.query(`SELECT * FROM imovel_conta_anexos WHERE uuid = $1`, [uuid]);
    expect(row).toMatchObject({ company_uuid: empresa, conta_uuid: conta, tipo: "comprovante", nome_arquivo: "foto.png", content_type: "image/png", tamanho: PNG.length });
    const url = new UrlAnexoContaUsecase(repo, storage as any);
    expect(await url.execute({ companyUuid: empresa, contaUuid: conta, anexoUuid: uuid })).toEqual({ url: `url-fake:${row.caminho}`, nomeArquivo: "foto.png" });
    await new RemoverAnexoContaUsecase(repo).execute({ companyUuid: empresa, contaUuid: conta, anexoUuid: uuid });
    await expect(url.execute({ companyUuid: empresa, contaUuid: conta, anexoUuid: uuid })).rejects.toMatchObject({ statusCode: 404 });
  });
});
