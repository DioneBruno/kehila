import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { StorageInterface } from "src/@modules/shared/connections/connectionStorage.interface";

export const IMAGEM_LOGIN_TAMANHO_MAXIMO = 5 * 1024 * 1024;
/** Validade da URL assinada devolvida pelo /ping e pelos detalhes da empresa. */
const URL_EXPIRA_EM_SEGUNDOS = 6 * 60 * 60;

const FORMATOS = [
  { tipo: "image/png", ext: "png", bate: (b: Buffer) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { tipo: "image/jpeg", ext: "jpg", bate: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    tipo: "image/webp",
    ext: "webp",
    bate: (b: Buffer) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  },
];

/** Confere o formato pelos bytes iniciais (não confia no mimetype enviado pelo navegador). */
export function validarImagemLogin(buffer: unknown): { tipo: string; ext: string } {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new ApiError("Envie uma imagem");
  if (buffer.length > IMAGEM_LOGIN_TAMANHO_MAXIMO) throw new ApiError("A imagem deve ter no máximo 5 MB");
  const formato = FORMATOS.find((f) => f.bate(buffer));
  if (!formato) throw new ApiError("Formato de imagem inválido. Use PNG, JPG ou WEBP");
  return { tipo: formato.tipo, ext: formato.ext };
}

/** Caminho no bucket guardado em `auth_companies.layout.imagemLogin`. */
export function caminhoDaImagemLogin(layout: unknown): string | null {
  const caminho = (layout as any)?.imagemLogin;
  return typeof caminho === "string" && caminho ? caminho : null;
}

export class ImagemLoginUrl {
  constructor(readonly storage: StorageInterface) {}

  /** URL assinada da imagem; null se não houver imagem ou se o storage falhar (o login usa a imagem padrão). */
  async gerar(layout: unknown): Promise<string | null> {
    const caminho = caminhoDaImagemLogin(layout);
    if (!caminho) return null;
    try {
      return await this.storage.generatePresignerUrl(caminho, URL_EXPIRA_EM_SEGUNDOS);
    } catch {
      return null;
    }
  }
}

export class ImagemLoginRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existe(companyUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(`SELECT 1 FROM auth_companies WHERE uuid = $1 AND deleted_at IS NULL`, [companyUuid]);
    return !!row;
  }

  async salvarCaminho(companyUuid: string, caminho: string): Promise<void> {
    await this.connectionHub.database!.query(
      `UPDATE auth_companies SET layout = COALESCE(layout, '{}'::jsonb) || jsonb_build_object('imagemLogin', $2::text), updated_at = now()
       WHERE uuid = $1`,
      [companyUuid, caminho],
    );
  }

  async removerCaminho(companyUuid: string): Promise<void> {
    await this.connectionHub.database!.query(
      `UPDATE auth_companies SET layout = COALESCE(layout, '{}'::jsonb) - 'imagemLogin', updated_at = now() WHERE uuid = $1`,
      [companyUuid],
    );
  }
}

export class EnviarImagemLoginUsecase {
  constructor(
    readonly repo: ImagemLoginRepository,
    readonly storage: StorageInterface,
    readonly urls: ImagemLoginUrl,
  ) {}

  async execute(input: { companyUuid: string; buffer: unknown }): Promise<{ imagemLoginUrl: string | null }> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const { tipo, ext } = validarImagemLogin(input.buffer);
    if (!(await this.repo.existe(input.companyUuid))) throw new ApiError("Empresa não encontrada", 404);

    // Nome novo a cada envio: evita cache do navegador/CDN servindo a imagem antiga.
    const caminho = `empresas/${input.companyUuid}/layout/login-${Date.now()}.${ext}`;
    await this.storage.upload(caminho, input.buffer as Buffer, tipo);
    await this.repo.salvarCaminho(input.companyUuid, caminho);
    return { imagemLoginUrl: await this.urls.gerar({ imagemLogin: caminho }) };
  }
}

export class RemoverImagemLoginUsecase {
  constructor(readonly repo: ImagemLoginRepository) {}

  /** Só desvincula; o arquivo continua no bucket (StorageInterface não tem delete). */
  async execute(input: { companyUuid: string }): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!(await this.repo.existe(input.companyUuid))) throw new ApiError("Empresa não encontrada", 404);
    await this.repo.removerCaminho(input.companyUuid);
  }
}
