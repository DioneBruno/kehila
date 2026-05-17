import type HttpClient from "../http/httpClient.interface";

export class LoginHttp {
  constructor(readonly http: HttpClient) {}

  async tokenGenerate(input: any) {
    const response = await this.http.post("/auth/token/generate", input);
    return response;
  }
}
