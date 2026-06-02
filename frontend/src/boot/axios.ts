import { boot } from "quasar/wrappers";
import { Platform } from "quasar";
import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { Notify, Loading } from "quasar";
import AxiosErrorService from "./axios.error.service";
import { AuthCookiesQuasar } from "src/@modules/auth/authCookies.quasar";

axios.defaults.validateStatus = function () {
  return true;
};
axios.defaults.timeout = 0; // sem timeout

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

function checkPlatform(): string | null {
  if (Platform.is.electron) return "electron";
  return "web";
}

function checkTenant(): string | null {
  if (Platform.is.electron) return localStorage.getItem("FLOW_TENANT");
  return null;
}

const urlApi = Platform.is.electron
  ? (localStorage.getItem("URL_API") as string)
  : (process.env.URL_API as string);

const api = axios.create({
  baseURL: urlApi,
  withCredentials: false,
  validateStatus: () => true,
  headers: {
    Accept: "application/json, text/plain, */*",
    tenant: checkTenant(),
    platform: checkPlatform(),
  },
});

// Controle para evitar múltiplas chamadas de refresh simultâneas
let isRefreshing = false;
let pendingRequests: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function resolvePendingRequests(token: string) {
  pendingRequests.forEach((p) => p.resolve(token));
  pendingRequests = [];
}

function rejectPendingRequests(error: any) {
  pendingRequests.forEach((p) => p.reject(error));
  pendingRequests = [];
}

function redirectToLogin() {
  const cookie = new AuthCookiesQuasar();
  cookie.deleteToken();
  cookie.deleteRefreshToken();
  Loading.hide();
  if (window.location.href.includes("publico")) return; // TODO: Rever essa logica
  window.location.href = "#/login";
}

async function tryRefreshToken(originalRequest: AxiosRequestConfig): Promise<any> {
  const cookie = new AuthCookiesQuasar();
  const refreshToken = cookie.getRefreshToken();

  if (!refreshToken) {
    redirectToLogin();
    return null;
  }

  // Se já existe um refresh em andamento, enfileira e aguarda
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      pendingRequests.push({
        resolve: (token) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };
          resolve(api(originalRequest));
        },
        reject,
      });
    });
  }

  isRefreshing = true;

  try {
    const response = await axios.post(
      `${urlApi}/auth/refresh-token`,
      { refreshToken },
      {
        headers: {
          tenant: checkTenant(),
          platform: checkPlatform(),
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      },
    );

    if (response.status === 200 || response.status === 201) {
      const { token, refreshToken: newRefreshToken } = response.data;
      cookie.setToken(token);
      if (newRefreshToken) cookie.setRefreshToken(newRefreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      resolvePendingRequests(token);
      originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${token}` };
      return api(originalRequest);
    }

    rejectPendingRequests(new Error("Refresh token inválido"));
    redirectToLogin();
    return null;
  } catch {
    rejectPendingRequests(new Error("Erro ao renovar token"));
    redirectToLogin();
    return null;
  } finally {
    isRefreshing = false;
  }
}

api.interceptors.request.use((config: any) => {
  const cookie = new AuthCookiesQuasar();
  const token = cookie.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(async (config: any) => {
  // TODO: Enviar essas regras para um service
  if (config.status == 401) {
    if (
      config.data.message ==
      "Você ja cadastrou sua conta, mas ainda não a verificou,  use o toke de autenticação para verifica-lá"
    ) {
      const user = JSON.parse(config.config.data);
      window.location.href = `#/verify-account/${user.email}`;
    } else if (
      config.data.message == "Esse usuario ja foi cadastrado, peça-o para verifica-lá" ||
      config.data.message == "O dono da empresa não pode ser excluido" ||
      config.data.message == "Só pode existir um único chefe em uma empresa"
    ) {
      window.location.href = "#/settings/home";
    } else if (
      ["Você deve ter uma chave da API para acessar aqui", "Acesso negado"].includes(
        config.data.message,
      )
    ) {
      return;
    } else if (config.data.message === "Usuário bloqueado.") {
      redirectToLogin();
    } else {
      // Tenta renovar o token antes de redirecionar para login
      const retryResponse = await tryRefreshToken(config.config);
      if (retryResponse) return retryResponse;
    }
    Loading.hide();
  }
  // Sucesso
  if (config.status < 300) {
    if (config.data.message) {
      Notify.create({
        progress: true,
        color: "positive",
        message: config.data.message,
        position: "bottom",
        actions: [{ icon: "close", color: "white", round: true }],
      });
    }
  }
  // Erro
  if (Number(config.status) > 299) {
    if (config.request.responseType == "blob") {
      const blob = new Blob([config.data]);
      const error = JSON.parse(await blob.text());
      Notify.create({
        progress: true,
        color: "negative",
        textColor: "grey-1",
        message: error.message,
        position: "bottom",
        actions: [{ icon: "close", color: "white", round: true }],
      });
    }
    if (config.data.message) {
      if (Array.isArray(config.data.message)) {
        config.data.message.forEach((message: string) => {
          Notify.create({
            progress: true,
            color: "negative",
            textColor: "grey-1",
            message: message,
            position: "bottom",
            actions: [{ icon: "close", color: "white", round: true }],
          });
        });
      } else {
        Notify.create({
          progress: true,
          color: "negative",
          textColor: "grey-1",
          message: config.data.message,
          position: "bottom",
          actions: [{ icon: "close", color: "white", round: true }],
        });
      }
      AxiosErrorService.execute(config.data);
      throw new Error(config.data.message);
    }
  }
  return config;
});

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;

  app.config.globalProperties.$api = api;
});

export { api };
