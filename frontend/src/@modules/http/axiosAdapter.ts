import { api } from "src/boot/axios";
import type { AxiosRequestConfig } from "axios";
import type HttpClient from "./httpClient.interface";

const defaultHeaders = {
  headers: {
    "Content-Type": "application/json",
  },
} as AxiosRequestConfig;

export default class AxiosAdapter implements HttpClient {
  async get(url: string, headers?: any) {
    const response = await api.get(url, headers ?? defaultHeaders);
    return response.data;
  }

  async post(url: string, request: object, headers: AxiosRequestConfig = defaultHeaders) {
    const { data } = await api.post(url, request, headers);
    return data;
  }

  async put(url: string, request: object, headers: AxiosRequestConfig = defaultHeaders) {
    const { data } = await api.put(url, request, headers);
    return data;
  }

  async patch(url: string, request: object, headers: AxiosRequestConfig = defaultHeaders) {
    const { data } = await api.patch(url, request, headers);
    return data;
  }

  async delete(url: string) {
    const { data } = await api.delete(url, defaultHeaders);
    return data;
  }
}
