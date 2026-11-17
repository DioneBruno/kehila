// Testes sem banco de dados: o repositório é falso, em memória.
import { TrustedDeviceUsecase } from "../trustedDevice.usecase";
import type { TrustedDeviceRepository, TrustedDeviceRow } from "../trustedDevice.repository";
import { hashDeviceToken } from "../trustedDevice.token";

const DIA = 24 * 60 * 60 * 1000;

class FakeRepo implements TrustedDeviceRepository {
  rows: (TrustedDeviceRow & { deviceName: string | null; lastUsedAt: Date | null })[] = [];
  ativos = new Set<string>();

  async criar(input: { uuid: string; userUuid: string; companyUuid: string; tokenHash: string; deviceName: string | null; expiresAt: Date }) {
    this.rows.push({ ...input, previousTokenHash: null, rotatedAt: null, revokedAt: null, lastUsedAt: null });
  }
  async buscarPorHash(companyUuid: string, hash: string) {
    const row = this.rows.find((r) => r.companyUuid === companyUuid && (r.tokenHash === hash || r.previousTokenHash === hash));
    return row ? { ...row } : null;
  }
  async rotacionar(input: { uuid: string; novoHash: string; hashAnterior: string; agora: Date; expiresAt: Date }) {
    const row = this.rows.find((r) => r.uuid === input.uuid)!;
    row.previousTokenHash = input.hashAnterior;
    row.tokenHash = input.novoHash;
    row.rotatedAt = input.agora;
    row.expiresAt = input.expiresAt;
    row.lastUsedAt = input.agora;
  }
  async revogarPorHash(companyUuid: string, hash: string, agora: Date) {
    for (const r of this.rows) {
      if (r.companyUuid === companyUuid && (r.tokenHash === hash || r.previousTokenHash === hash)) r.revokedAt = agora;
    }
  }
  async usuarioAtivoNaEmpresa(companyUuid: string, userUuid: string) {
    return this.ativos.has(`${companyUuid}:${userUuid}`);
  }
  async gerarToken(_companyUuid: string, userUuid: string) {
    return { token: `jwt-${userUuid}` };
  }
}

describe("TrustedDeviceUsecase", () => {
  let agora: Date;
  let repo: FakeRepo;
  let usecase: TrustedDeviceUsecase;

  const avancar = (ms: number) => (agora = new Date(agora.getTime() + ms));
  const emitir = () => usecase.emitir({ companyUuid: "c1", userUuid: "u1", deviceName: "Firefox" });
  const recusa = async (p: Promise<unknown>) => {
    await expect(p).rejects.toThrow("Dispositivo não reconhecido");
    await expect(p).rejects.toMatchObject({ statusCode: 401 });
  };

  beforeEach(() => {
    agora = new Date("2026-01-01T00:00:00Z");
    repo = new FakeRepo();
    repo.ativos.add("c1:u1");
    usecase = new TrustedDeviceUsecase(repo, { dias: 30, agora: () => agora });
  });

  test("emitir grava só o hash e expira em 30 dias", async () => {
    const t = await emitir();
    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0].tokenHash).toBe(hashDeviceToken(t));
    expect(repo.rows[0].tokenHash).not.toBe(t);
    expect(repo.rows[0].expiresAt.getTime()).toBe(agora.getTime() + 30 * DIA);
    expect(repo.rows[0].deviceName).toBe("Firefox");
  });

  test("emitir trunca o nome do dispositivo em 255 caracteres", async () => {
    await usecase.emitir({ companyUuid: "c1", userUuid: "u1", deviceName: "x".repeat(400) });
    expect(repo.rows[0].deviceName).toHaveLength(255);
  });

  test("login com token atual devolve JWT e novo deviceToken", async () => {
    const t = await emitir();
    const r = await usecase.login({ companyUuid: "c1", deviceToken: t });
    expect(r.token).toBe("jwt-u1");
    expect(r.deviceToken).toBeDefined();
    expect(r.deviceToken).not.toBe(t);
  });

  test("token anterior vale por 60s depois da rotação, sem novo deviceToken", async () => {
    const t = await emitir();
    await usecase.login({ companyUuid: "c1", deviceToken: t });
    avancar(59 * 1000);
    const r = await usecase.login({ companyUuid: "c1", deviceToken: t });
    expect(r.token).toBe("jwt-u1");
    expect(r.deviceToken).toBeUndefined();
  });

  test("hash anterior fora da janela é recusado", async () => {
    const t = await emitir();
    await usecase.login({ companyUuid: "c1", deviceToken: t });
    avancar(61 * 1000);
    await recusa(usecase.login({ companyUuid: "c1", deviceToken: t }));
  });

  test("token rotacionado vira o válido e renova a validade", async () => {
    const t = await emitir();
    avancar(10 * DIA);
    const r1 = await usecase.login({ companyUuid: "c1", deviceToken: t });
    const r2 = await usecase.login({ companyUuid: "c1", deviceToken: r1.deviceToken! });
    expect(r2.token).toBe("jwt-u1");
    expect(repo.rows[0].expiresAt.getTime()).toBe(agora.getTime() + 30 * DIA);
  });

  test("token expirado é recusado", async () => {
    const t = await emitir();
    avancar(31 * DIA);
    await recusa(usecase.login({ companyUuid: "c1", deviceToken: t }));
  });

  test("token revogado é recusado", async () => {
    const t = await emitir();
    await usecase.revogar({ companyUuid: "c1", deviceToken: t });
    await recusa(usecase.login({ companyUuid: "c1", deviceToken: t }));
  });

  test("token de outra empresa é recusado", async () => {
    const t = await emitir();
    await recusa(usecase.login({ companyUuid: "c2", deviceToken: t }));
  });

  test("usuário inativo na empresa é recusado", async () => {
    const t = await emitir();
    repo.ativos.delete("c1:u1");
    await recusa(usecase.login({ companyUuid: "c1", deviceToken: t }));
  });

  test("token vazio é recusado", async () => {
    await recusa(usecase.login({ companyUuid: "c1", deviceToken: "" }));
  });

  test("revogar com token vazio não faz nada", async () => {
    await emitir();
    await usecase.revogar({ companyUuid: "c1", deviceToken: "" });
    expect(repo.rows[0].revokedAt).toBeNull();
  });
});
