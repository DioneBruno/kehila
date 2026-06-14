import type HttpClient from "../http/httpClient.interface";

export class LoginHttp {
  constructor(readonly http: HttpClient) {}

  async tokenGenerate(input: any) {
    const response = await this.http.post("token-generate", input);
    return response;
  }

  async randomCodeGenerate(input: { username: string }) {
    const response = await this.http.post("random-code-authentication/generate", input);
    return response;
  }

  async randomCodeValidate(input: { username: string; code: string }) {
    const response = await this.http.post("random-code-authentication/validate", input);
    return response;
  }
}
