import HttpClient from "../http/httpClient.interface";

export class PublicHttp {
  constructor(readonly http: HttpClient) {}

  async ping() {
    const response = await this.http.get("ping");
    return response;
  }
}
