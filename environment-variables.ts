const ns = "DATAINGEST__NEWSAPI__";
export const envVar = (key: string) => process.env[`${ns}${key}`];
export function requiredEnvVar(key: string) {

    const val = envVar(key);
    if (val == undefined || val == null) throw new Error(`Missing environment variable: ${ns}${key}`);
    return val;

}
