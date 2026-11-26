import { EnviarImagemLoginUsecase, ImagemLoginUrl, RemoverImagemLoginUsecase, validarImagemLogin } from "../imagemLogin";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8 ")]);

const montar = (existe = true) => {
  const repo = { existe: jest.fn(async () => existe), salvarCaminho: jest.fn(async () => undefined), removerCaminho: jest.fn(async () => undefined) };
  const storage = {
    upload: jest.fn(async (path: string) => ({ path })),
    generatePresignerUrl: jest.fn(async (path: string) => `https://s3/${path}?assinado`),
    download: jest.fn(),
  };
  const urls = new ImagemLoginUrl(storage as any);
  return { repo, storage, enviar: new EnviarImagemLoginUsecase(repo as any, storage as any, urls), remover: new RemoverImagemLoginUsecase(repo as any), urls };
};

describe("validarImagemLogin", () => {
  it.each([
    [PNG, "image/png", "png"],
    [JPG, "image/jpeg", "jpg"],
    [WEBP, "image/webp", "webp"],
  ])("reconhece pelos bytes iniciais", (buffer, tipo, ext) => {
    expect(validarImagemLogin(buffer)).toEqual({ tipo, ext });
  });

  it.each([
    [undefined, "Envie uma imagem"],
    [Buffer.alloc(0), "Envie uma imagem"],
    [Buffer.from("%PDF-1.4"), "Formato de imagem inválido. Use PNG, JPG ou WEBP"],
    [Buffer.from("<svg></svg>"), "Formato de imagem inválido. Use PNG, JPG ou WEBP"],
    [Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]), "A imagem deve ter no máximo 5 MB"],
  ])("rejeita arquivo inválido com 400", (buffer, message) => {
    expect(() => validarImagemLogin(buffer)).toThrow(expect.objectContaining({ message, statusCode: 400 }));
  });
});

describe("EnviarImagemLoginUsecase", () => {
  it("envia ao storage com o tipo detectado, grava o caminho e devolve a URL assinada", async () => {
    const { enviar, repo, storage } = montar();
    const r = await enviar.execute({ companyUuid: "c1", buffer: PNG });

    const [caminho, , tipo] = storage.upload.mock.calls[0] as unknown as [string, Buffer, string];
    expect(caminho).toMatch(/^empresas\/c1\/layout\/login-\d+\.png$/);
    expect(tipo).toBe("image/png");
    expect(repo.salvarCaminho).toHaveBeenCalledWith("c1", caminho);
    expect(r.imagemLoginUrl).toBe(`https://s3/${caminho}?assinado`);
  });

  it("não envia nada se a imagem for inválida ou a empresa não existir", async () => {
    const a = montar();
    await expect(a.enviar.execute({ companyUuid: "c1", buffer: Buffer.from("texto") })).rejects.toMatchObject({ statusCode: 400 });
    const b = montar(false);
    await expect(b.enviar.execute({ companyUuid: "c1", buffer: PNG })).rejects.toMatchObject({ statusCode: 404 });
    expect(a.storage.upload).not.toHaveBeenCalled();
    expect(b.storage.upload).not.toHaveBeenCalled();
  });
});

describe("RemoverImagemLoginUsecase", () => {
  it("desvincula a imagem da empresa", async () => {
    const { remover, repo } = montar();
    await remover.execute({ companyUuid: "c1" });
    expect(repo.removerCaminho).toHaveBeenCalledWith("c1");
  });

  it("404 para empresa inexistente", async () => {
    const { remover, repo } = montar(false);
    await expect(remover.execute({ companyUuid: "c1" })).rejects.toMatchObject({ statusCode: 404 });
    expect(repo.removerCaminho).not.toHaveBeenCalled();
  });
});

describe("ImagemLoginUrl", () => {
  it("null sem imagem e null quando o storage falha", async () => {
    const { urls, storage } = montar();
    expect(await urls.gerar({})).toBeNull();
    expect(await urls.gerar(null)).toBeNull();
    storage.generatePresignerUrl.mockRejectedValueOnce(new Error("sem credencial"));
    expect(await urls.gerar({ imagemLogin: "x.png" })).toBeNull();
  });
});
