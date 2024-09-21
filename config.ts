import { envVar, requiredEnvVar } from "./environment-variables.js";

export const version = envVar("VERSION") || "0.1.0";
export const ns = envVar("NS") || "dataingest__newsapi";
export const criteria = envVar("CRITERIA") || "wheat AND commodity";
export const connectionString = envVar("CNN") || "postgres://postgres:asdQWER1234@localhost:5432";
export const databaseName = envVar("DATABASE_NAME") || `${ns}__default`;
export const apiKey = requiredEnvVar("API_KEY");
