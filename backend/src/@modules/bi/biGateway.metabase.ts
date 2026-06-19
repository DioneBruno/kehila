import { ApiError } from "../shared/apiError";
import { BiEntity } from "./bi.enitty";
import jwt from "jsonwebtoken";

export class BiGatewayMetabase {
  constructor() {}

  async montar(bi: BiEntity) {
    const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY!;
    const referencia = bi.referencia();
    if (!["dashboard", "question"].includes(referencia.tipo)) throw new ApiError("Tipo de referência inválido");
    const payload = {
      resource: {
        [referencia.tipo]: Number(referencia.valor),
      },
      params: {},
      exp: Math.round(Date.now() / 1000) + 600,
    };
    console.log(payload);
    return jwt.sign(payload, METABASE_SECRET_KEY);
  }
}
