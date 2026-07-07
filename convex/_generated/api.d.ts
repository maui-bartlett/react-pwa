/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appVersion from "../appVersion.js";
import type * as auth from "../auth.js";
import type * as campaigns from "../campaigns.js";
import type * as catalog from "../catalog.js";
import type * as characters from "../characters.js";
import type * as classes from "../classes.js";
import type * as data_dungeonsAndDragonsFeats from "../data/dungeonsAndDragonsFeats.js";
import type * as data_dungeonsAndDragonsFeatures from "../data/dungeonsAndDragonsFeatures.js";
import type * as data_dungeonsAndDragonsItems from "../data/dungeonsAndDragonsItems.js";
import type * as data_dungeonsAndDragonsSpells from "../data/dungeonsAndDragonsSpells.js";
import type * as data_fabulaUltimaClasses from "../data/fabulaUltimaClasses.js";
import type * as data_fabulaUltimaItems from "../data/fabulaUltimaItems.js";
import type * as data_openDndSpellCatalog from "../data/openDndSpellCatalog.js";
import type * as gameSystems from "../gameSystems.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as items from "../items.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_avatarTechniqueFatigue from "../lib/avatarTechniqueFatigue.js";
import type * as lib_fabulaMeta from "../lib/fabulaMeta.js";
import type * as lib_hash from "../lib/hash.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appVersion: typeof appVersion;
  auth: typeof auth;
  campaigns: typeof campaigns;
  catalog: typeof catalog;
  characters: typeof characters;
  classes: typeof classes;
  "data/dungeonsAndDragonsFeats": typeof data_dungeonsAndDragonsFeats;
  "data/dungeonsAndDragonsFeatures": typeof data_dungeonsAndDragonsFeatures;
  "data/dungeonsAndDragonsItems": typeof data_dungeonsAndDragonsItems;
  "data/dungeonsAndDragonsSpells": typeof data_dungeonsAndDragonsSpells;
  "data/fabulaUltimaClasses": typeof data_fabulaUltimaClasses;
  "data/fabulaUltimaItems": typeof data_fabulaUltimaItems;
  "data/openDndSpellCatalog": typeof data_openDndSpellCatalog;
  gameSystems: typeof gameSystems;
  http: typeof http;
  invites: typeof invites;
  items: typeof items;
  "lib/auth": typeof lib_auth;
  "lib/avatarTechniqueFatigue": typeof lib_avatarTechniqueFatigue;
  "lib/fabulaMeta": typeof lib_fabulaMeta;
  "lib/hash": typeof lib_hash;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
