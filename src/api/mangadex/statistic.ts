import { GetMangasStatisticResponse } from "../../types/mangadex";
import * as util from "./util";

export type GetMangasStatisticRequestOptions = {
  manga: string[];
};

export const getMangasStatistic = function (
  options?: GetMangasStatisticRequestOptions,
) {
  const stats: Record<string, any> = {};
  for (const id of options?.manga || []) {
    stats[id] = {
      rating: { average: 9.8, bayesian: 9.8 },
      follows: 1250,
    };
  }
  return Promise.resolve({
    data: {
      result: "ok",
      response: "collection",
      statistics: stats,
    },
  });
};

export const getGroupStatistic = function (groupId: string) {
  const path = `/statistics/group/${groupId}`;

  return util.createHttpsRequestPromise<GetMangasStatisticResponse>(
    "GET",
    path,
  );
};
