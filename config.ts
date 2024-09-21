export const ns = "DATAINGEST__NEWSAPI__";
export const version = envVar("VERSION") || "0.1.0";
export const criteria = envVar("CRITERIA") || "wheat AND commodity";
export const connectionString = envVar("CNN") || "postgres://postgres:asdQWER1234@localhost:5432";
export const databaseName = envVar("DATABASE_NAME") || `${ns}default`.toLowerCase();
export const apiKey = requiredEnvVar("API_KEY");

function envVar(key: string) {

    return process.env[`${ns}${key}`];

}

function requiredEnvVar(key: string) {

    const val = envVar(key);
    if (val == undefined || val == null) throw new Error(`Missing environment variable: ${ns}${key}`);
    return val;

}

