const TOKEN_NAME = "_kehila_token_bearer";
const REFRESH_TOKEN_NAME = "_kehila_refresh_token";
const DEVICE_TOKEN_NAME = "_kehila_trusted_device";
const SAIDA_MANUAL_NAME = "_kehila_saiu";

export class AuthCookiesQuasar {
  setToken(token: any) {
    // Cookies.set(TOKEN_NAME, token, { expires: 1, path: "/" });
    localStorage.setItem(TOKEN_NAME, token);
  }
  getToken() {
    // return Cookies.get(TOKEN_NAME);
    const token = localStorage.getItem(TOKEN_NAME) as string;
    if (["null", "undefined"].includes(token)) return null;
    return token;
  }
  deleteToken() {
    // Cookies.remove(TOKEN_NAME);
    localStorage.removeItem(TOKEN_NAME);
  }
  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_NAME, token);
  }
  getRefreshToken(): string | null {
    const token = localStorage.getItem(REFRESH_TOKEN_NAME) as string;
    if (["null", "undefined"].includes(token)) return null;
    return token;
  }
  deleteRefreshToken(): void {
    localStorage.removeItem(REFRESH_TOKEN_NAME);
  }
  setDeviceToken(token: string): void {
    localStorage.setItem(DEVICE_TOKEN_NAME, token);
  }
  getDeviceToken(): string | null {
    const token = localStorage.getItem(DEVICE_TOKEN_NAME);
    if (!token || ["null", "undefined"].includes(token)) return null;
    return token;
  }
  deleteDeviceToken(): void {
    localStorage.removeItem(DEVICE_TOKEN_NAME);
  }
  /** "Sair" pula o login automático uma vez, só nesta aba; a próxima visita entra direto. */
  marcarSaidaManual(): void {
    try {
      sessionStorage.setItem(SAIDA_MANUAL_NAME, "1");
    } catch {
      // sessionStorage indisponível: o login automático simplesmente acontece
    }
  }
  consumirSaidaManual(): boolean {
    try {
      const saiu = sessionStorage.getItem(SAIDA_MANUAL_NAME) === "1";
      sessionStorage.removeItem(SAIDA_MANUAL_NAME);
      return saiu;
    } catch {
      return false;
    }
  }
}
