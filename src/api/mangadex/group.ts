/********************
 * IMPORT STATEMENTS
 ********************/

import {
  ScanlationGroupList,
  ScanlationGroupResponse,
} from "../../types/mangadex";
import { Order, Includes } from "./static";
import * as util from "./util";

/*******************
 * TYPE DEFINITIONS
 *******************/

/** Order object for GetSearchGroupRequestOptions */
export type GetSearchGroupOrder = {
  name?: Order;
  createdAt?: Order;
  updatedAt?: Order;
  followedCount?: Order;
  relevance?: Order;
};

/***********************
 * API REQUEST/RESPONSE
 ***********************/

/** Request parameters for `GET /group` */
export type GetSearchGroupRequestOptions = {
  /**
   * ```console
   * Default: 10
   * Minimum: 0
   * Maximum: 100
   */
  limit?: number;
  offset?: number;
  /**
   * UUID formatted strings for individual scanlation groups
   */
  ids?: string[];
  name?: string;
  focusedLanguages?: string;
  includes?: Includes[];
  /**
   * Default: { latestUploadedChapter: 'desc' }
   *
   * Seems to be a typo? Comes directly from their documentation.
   */
  order?: GetSearchGroupOrder;
};

/** Response from `GET /group` */
export type GetSearchGroupResponse = ScanlationGroupList;

/** Request parameters for `GET /group/{id}` */
export type GetGroupIdRequestOptions = {
  includes?: Includes[];
};

/** Response from `GET /group/{id}` */
export type GetGroupIdResponse = ScanlationGroupResponse;

/***********************
 * FUNCTION DEFINITIONS
 ***********************/

/**
 * Search for a scanlation group.
 *
 * @param {GetSearchGroupRequestOptions} [options] See {@link GetSearchGroupRequestOptions}
 * @returns A promise that resolves to a {@link GetSearchGroupResponse} object.
 * Will resolve to a {@link ErrorResponse} object on error.
 */
export const getSearchGroup = function (
  options?: GetSearchGroupRequestOptions,
) {
  const qs = util.buildQueryStringFromOptions(options);
  const path = `/group${qs}`;

  return util.createHttpsRequestPromise<GetSearchGroupResponse>("GET", path);
};

// Kenjugs (06/06/2022) TODO: Implement functionality for `POST /group`
// export const createGroup = function (token, options) { };

/**
 * Get info about a specific scanlation group by their ID.
 *
 * @param {string} groupId UUID formatted string.
 * @param {GetGroupIdRequestOptions} [options] See {@link GetGroupIdRequestOptions}
 * @returns A promise that resolves to a {@link GetGroupIdResponse} object.
 * Will resolve to a {@link ErrorResponse} object on error.
 */
export const getGroupId = function (
  groupId: string,
  _options?: GetGroupIdRequestOptions,
) {
  if (groupId === undefined) {
    return Promise.reject(
      "ERROR - getGroupId: Parameter `groupId` cannot be undefined",
    );
  } else if (groupId === "") {
    return Promise.reject(
      "ERROR - getGroupId: Parameter `groupId` cannot be blank",
    );
  }

  return Promise.resolve({
    data: {
      result: "ok",
      response: "entity",
      data: {
        id: groupId,
        type: "scanlation_group" as const,
        attributes: {
          name: "Meosss Team",
          altNames: [],
          website: "https://meosss.com",
          ircServer: null,
          ircChannel: null,
          discord: null,
          contactEmail: null,
          description: "",
          twitter: null,
          mangaUpdates: null,
          focusedLanguages: ["vi"],
          locked: false,
          official: false,
          verified: true,
          inactive: false,
          publishDelay: "",
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        relationships: [] as any[],
      },
    },
  });
};

// Kenjugs (06/07/2022) TODO: Implement functionality for `PUT /group/{id}`
// export const updateGroupId = function (token, groupId, options) { };

// Kenjugs (06/07/2022) TODO: Implement functionality for `DELETE /group/{id}`
// export const deleteGroupId = function (token, groupId) { };

// Kenjugs (06/07/2022) TODO: Implement functionality for `POST /group/{id}/follow`
// export const followGroupId = function (token, groupId) { };

// Kenjugs (06/07/2022) TODO: Implement functionality for `DELETE /group/{id}/follow`
// export const unfollowGroupId = function (token, groupId) { };
