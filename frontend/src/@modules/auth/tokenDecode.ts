import { jwtDecode } from "jwt-decode";
import { AuthCookiesQuasar } from "src/@modules/auth/authCookies.quasar";
const cookie = new AuthCookiesQuasar();

type TokenDecodeOutput = {
  user: {
    uuid: string;
    cpf: string;
    email: string;
    name: string;
  };
  company?: {
    uuid: string;
    name: string;
    cpfCnpj: string;
  };
};

export default class TokenDecode {
  static execute(): TokenDecodeOutput | null {
    const token = cookie.getToken() ? cookie.getToken() : null;
    const tokenDecoded = token ? jwtDecode(token) : (null as any);
    // console.log(tokenDecoded);
    return {
      user: tokenDecoded.user,
      company: tokenDecoded.company,
    };
  }
}
