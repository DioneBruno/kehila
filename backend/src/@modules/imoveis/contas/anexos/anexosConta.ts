import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { StorageInterface } from "src/@modules/shared/connections/connectionStorage.interface";
import { garantirUuid } from "../../shared/garantirUuid";
import { ANEXO_TIPOS, AnexoTipo } from "../../shared/imoveis.tipos";
import {
  MSG_ANEXO_NAO_ENCONTRADO,
  MSG_ARQUIVO_GRANDE,
  MSG_CONTA_NAO_ENCONTRADA,
  MSG_ENVIE_ARQUIVO,
  MSG_FORMATO_ANEXO,
  MSG_TIPO_ANEXO_INVALIDO,
} from "../conta.entity";

export const ANEXO_TAMANHO_MAXIMO = 10 * 1024 * 1024;
const URL_EXPIRA_EM_SEGUNDOS = 300;
const NOME_MAXIMO = 255;

const FORMATOS = [
  { tipo: "application/pdf", ext: "pdf", bate: (b: Buffer) => b.subarray(0, 4).toString("latin1") === "%PDF" },
  { tipo: "image/png", ext: "png", bate: (b: Buffer) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { tipo: "image/jpeg", ext: "jpg", bate: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
];

/** Confere o formato pelos bytes iniciais (não confia no mimetype/extensão enviados pelo navegador). */
export function validarArquivoAnexo(buffer: unknown): { tipo: string; ext: string } {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new ApiError(MSG_ENVIE_ARQUIVO);
  if (buffer.length > ANEXO_TAMANHO_MAXIMO) throw new ApiError(MSG_ARQUIVO_GRANDE);
  const formato = FORMATOS.find((f) => f.bate(buffer));
  if (!formato) throw new ApiError(MSG_FORMATO_ANEXO);
  return { tipo: formato.tipo, ext: formato.ext };
}

export type AnexoRegistro = {
  uuid: string;
  companyUuid: string;
  contaUuid: string;
  tipo: AnexoTipo;
  nomeArquivo: string;
  caminho: string;
  contentType: string;
  tamanho: number;
};

export class AnexosContaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async contaExiste(companyUuid: string, contaUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(`SELECT 1 FROM imovel_contas WHERE company_uuid = $1 AND uuid = $2 AND deleted_at IS NULL`, [
      companyUuid,
      contaUuid,
    ]);
    return !!row;
  }

  async inserir(a: AnexoRegistro): Promise<void> {
    await this.connectionHub.database!.query(
      `INSERT INTO imovel_conta_anexos (uuid, company_uuid, conta_uuid, tipo, nome_arquivo, caminho, content_type, tamanho)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [a.uuid, a.companyUuid, a.contaUuid, a.tipo, a.nomeArquivo, a.caminho, a.contentType, a.tamanho],
    );
  }

  async buscar(companyUuid: string, contaUuid: string, anexoUuid: string): Promise<{ caminho: string; nomeArquivo: string } | null> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT caminho, nome_arquivo FROM imovel_conta_anexos WHERE company_uuid = $1 AND conta_uuid = $2 AND uuid = $3 AND deleted_at IS NULL`,
      [companyUuid, contaUuid, anexoUuid],
    );
    return row ? { caminho: row.caminho, nomeArquivo: row.nome_arquivo } : null;
  }

  /** Soft delete; devolve false se não havia anexo ativo nessa conta. */
  async remover(companyUuid: string, contaUuid: string, anexoUuid: string): Promise<boolean> {
    const rows = await this.connectionHub.database!.query(
      `UPDATE imovel_conta_anexos SET deleted_at = now()
       WHERE company_uuid = $1 AND conta_uuid = $2 AND uuid = $3 AND deleted_at IS NULL RETURNING uuid`,
      [companyUuid, contaUuid, anexoUuid],
    );
    // Dependendo do driver, o resultado de UPDATE ... RETURNING vem como [rows, count].
    const lista = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;
    return Array.isArray(lista) && lista.length > 0;
  }
}

export type EnviarAnexoContaInput = { companyUuid: string; contaUuid: string; tipo: string; buffer: unknown; nomeArquivo?: string };

export class EnviarAnexoContaUsecase {
  constructor(
    readonly repo: AnexosContaRepository,
    readonly storage: StorageInterface,
  ) {}

  async execute(input: EnviarAnexoContaInput): Promise<{ uuid: string }> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const contaUuid = garantirUuid(input.contaUuid, MSG_CONTA_NAO_ENCONTRADA);
    if (!ANEXO_TIPOS.includes(input.tipo as AnexoTipo)) throw new ApiError(MSG_TIPO_ANEXO_INVALIDO);
    const { tipo: contentType, ext } = validarArquivoAnexo(input.buffer);
    const buffer = input.buffer as Buffer;
    if (!(await this.repo.contaExiste(input.companyUuid, contaUuid))) throw new ApiError(MSG_CONTA_NAO_ENCONTRADA, 404);

    const nome = typeof input.nomeArquivo === "string" ? input.nomeArquivo.trim() : "";
    const nomeArquivo = (nome || `anexo.${ext}`).slice(0, NOME_MAXIMO);
    const uuid = randomUUID();
    const caminho = `empresas/${input.companyUuid}/imoveis/contas/${contaUuid}/${uuid}.${ext}`;
    await this.storage.upload(caminho, buffer, contentType);
    await this.repo.inserir({
      uuid,
      companyUuid: input.companyUuid,
      contaUuid,
      tipo: input.tipo as AnexoTipo,
      nomeArquivo,
      caminho,
      contentType,
      tamanho: buffer.length,
    });
    return { uuid };
  }
}

export type AnexoContaRef = { companyUuid: string; contaUuid: string; anexoUuid: string };

export class UrlAnexoContaUsecase {
  constructor(
    readonly repo: AnexosContaRepository,
    readonly storage: StorageInterface,
  ) {}

  async execute(input: AnexoContaRef): Promise<{ url: string; nomeArquivo: string }> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const contaUuid = garantirUuid(input.contaUuid, MSG_CONTA_NAO_ENCONTRADA);
    const anexoUuid = garantirUuid(input.anexoUuid, MSG_ANEXO_NAO_ENCONTRADO);
    const anexo = await this.repo.buscar(input.companyUuid, contaUuid, anexoUuid);
    if (!anexo) throw new ApiError(MSG_ANEXO_NAO_ENCONTRADO, 404);
    const url = await this.storage.generatePresignerUrl(anexo.caminho, URL_EXPIRA_EM_SEGUNDOS);
    return { url, nomeArquivo: anexo.nomeArquivo };
  }
}

export class RemoverAnexoContaUsecase {
  constructor(readonly repo: AnexosContaRepository) {}

  /** Só desvincula; o arquivo continua no bucket (StorageInterface não tem delete). */
  async execute(input: AnexoContaRef): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const contaUuid = garantirUuid(input.contaUuid, MSG_CONTA_NAO_ENCONTRADA);
    const anexoUuid = garantirUuid(input.anexoUuid, MSG_ANEXO_NAO_ENCONTRADO);
    if (!(await this.repo.remover(input.companyUuid, contaUuid, anexoUuid))) throw new ApiError(MSG_ANEXO_NAO_ENCONTRADO, 404);
  }
}
