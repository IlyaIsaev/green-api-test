import { atom } from "@reatom/core";

export const UNIVERSAL_API_URL = "https://api.greenapi.com" as const;

export const idInstance = atom("", "idInstance");
export const apiTokenInstance = atom("", "apiTokenInstance");
