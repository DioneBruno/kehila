import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";
import type { TrustedDeviceRepository } from "./trustedDevice.repository";
import { gerarDeviceToken, hashDeviceToken } from "./trustedDevice.token";

const DIA_MS = 24 * 60 * 60 * 1000;
/** Outra aba pode ainda estar usando o token anterior logo após a rotação. */
const JANELA_TOKEN_ANTERIOR_MS = 60 * 1000;
const TAMANHO_MAX_NOME = 255;

export type TrustedDeviceOptions = {
  dias?: number;
  agora?: () => Date;
};

export class TrustedDeviceUsecase {
  private readonly dias: number;
  private readonly agora: () => Date;

  constructor(
    readonly repo: TrustedDeviceRepository,
    opts: TrustedDeviceOptions = {},
  ) {
    this.dias = opts.dias ?? (Number(process.env.AUTH_TRUSTED_DEVICE_DAYS) || 30);
    this.agora = opts.agora ?? (() => new Date());
  }

  async emitir(input: { companyUuid: string; userUuid: string; deviceName?: string | null }): Promise<string> {
    const token = gerarDeviceToken();
    await this.repo.criar({
      uuid: randomUUID(),
      userUuid: input.userUuid,
      companyUuid: input.companyUuid,
      tokenHash: hashDeviceToken(token),
      deviceName: input.deviceName ? String(input.deviceName).slice(0, TAMANHO_MAX_NOME) : null,
      expiresAt: this.expiraEm(),
    });
    return token;
  }

  async login(input: { companyUuid: string; deviceToken: string }): Promise<{ token: string; deviceToken?: string }> {
    if (!input.companyUuid || !input.deviceToken || typeof input.deviceToken !== "string") throw this.naoReconhecido();

    const agora = this.agora();
    const hash = hashDeviceToken(input.deviceToken);
    const device = await this.repo.buscarPorHash(input.companyUuid, hash);
    if (!device || device.revokedAt || device.expiresAt.getTime() <= agora.getTime()) throw this.naoReconhecido();

    const casouAtual = device.tokenHash === hash;
    if (!casouAtual) {
      const dentroDaJanela = device.rotatedAt && agora.getTime() - device.rotatedAt.getTime() <= JANELA_TOKEN_ANTERIOR_MS;
      if (!dentroDaJanela) throw this.naoReconhecido();
    }

    if (!(await this.repo.usuarioAtivoNaEmpresa(input.companyUuid, device.userUuid))) throw this.naoReconhecido();

    const { token } = await this.repo.gerarToken(input.companyUuid, device.userUuid);
    if (!casouAtual) return { token };

    const novoToken = gerarDeviceToken();
    const rotacionou = await this.repo.rotacionar({
      uuid: device.uuid,
      novoHash: hashDeviceToken(novoToken),
      hashAnterior: hash,
      agora,
      expiresAt: this.expiraEm(),
    });
    // Outra requisição rotacionou primeiro: o token dela é o válido, não devolvemos o nosso.
    if (!rotacionou) return { token };
    return { token, deviceToken: novoToken };
  }

  async revogar(input: { companyUuid: string; deviceToken: string }): Promise<void> {
    if (!input.companyUuid || !input.deviceToken || typeof input.deviceToken !== "string") return;
    await this.repo.revogarPorHash(input.companyUuid, hashDeviceToken(input.deviceToken), this.agora());
  }

  private expiraEm(): Date {
    return new Date(this.agora().getTime() + this.dias * DIA_MS);
  }

  private naoReconhecido() {
    return new ApiError("Dispositivo não reconhecido", 401);
  }
}
