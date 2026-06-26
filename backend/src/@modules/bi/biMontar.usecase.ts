import { ApiError } from "../shared/apiError";
import { BiGatewayMetabase } from "./biGateway.metabase";
import { BiRepository } from "./biRepostiory";

export type BiMontarInput = {
  companyUuid: string;
  uuid: string;
};

export class BiMontarUsecase {
  constructor(
    readonly biRepository: BiRepository,
    readonly biGatewayMetabase: BiGatewayMetabase,
  ) {}

  async execute(input: BiMontarInput): Promise<any> {
    const bi = await this.biRepository.findBi(input.companyUuid, input.uuid);
    if (!bi) throw new ApiError("BI não encontrado");
    const response = await this.biGatewayMetabase.montar(bi);
    return response;
  }
}
