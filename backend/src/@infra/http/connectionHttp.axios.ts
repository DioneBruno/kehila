import axios, { AxiosRequestConfig } from "axios";
import { ConnectionHttpInterface } from "src/@modules/shared/connections/connectionHttp.interface";

axios.defaults.validateStatus = function () {
  return true;
};
axios.defaults.proxy = false;
axios.defaults.timeout = 30000; // 30 segundos

const config: AxiosRequestConfig = {
  maxBodyLength: Infinity,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
};

export class ConnectionHttpAxios implements ConnectionHttpInterface {
  async delete(uri: string, headers?: any): Promise<{ status: string; statusText: string; data: any }> {
    if (headers) config.headers = { ...headers };

    const response = await axios.delete(uri, config);

    if (Number(response.status) > 299) {
      console.log(`Erro AxiosDELETE CODE: ${response.status} - ${response.statusText} `, JSON.stringify(response.data));
    }

    return {
      status: `${response.status}`,
      statusText: response.statusText,
      data: response.data,
    };
  }
  async post(uri: string, request?: any, headers?: any): Promise<{ status: string; statusText: string; data: any }> {
    if (headers) config.headers = { ...headers };

    const response = await axios.post(uri, request, config);

    if (Number(response.status) > 299) {
      console.log(`Erro AxiosPOST CODE: ${response.status} - ${response.statusText} `, JSON.stringify(response.data));
    }

    return {
      status: `${response.status}`,
      statusText: response.statusText,
      data: response.data,
    };
  }
  async put(uri: string, request?: any, headers?: any): Promise<{ status: string; statusText: string; data: any }> {
    if (headers) config.headers = { ...headers };

    const response = await axios.put(uri, request, config);

    if (Number(response.status) > 299) {
      // console.log(`Erro AxiosPut CODE: ${response.status} - ${response.statusText} `, JSON.stringify(response));
      // console.log(response);
    }

    return {
      status: `${response.status}`,
      statusText: response.statusText,
      data: response.data,
    };
  }
  async get(uri: string, headers?: any): Promise<any> {
    if (headers) config.headers = { ...headers };

    const response = await axios.get(uri, config);

    if (Number(response.status) > 299) {
      console.log(`Erro AxiosGET CODE: ${response.status} - ${response.statusText} `, response);
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  }
}
