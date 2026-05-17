const TOKEN_NAME = "_kehila_token_bearer";
const REFRESH_TOKEN_NAME = "_kehila_refresh_token";

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
}
