import type HttpClient from "../http/httpClient.interface";

export class AuthHttp {
  constructor(readonly http: HttpClient) {}

  async me() {
    return this.http.post(`auth/me`, {});
  }
}
