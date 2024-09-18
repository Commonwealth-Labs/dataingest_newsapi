
import pg, { Client } from "pg";
import { envVar, requiredEnvVar } from "./environment-variables.js";
import { logResult, logRows } from "./logger.js";

const criteria = envVar("CRITERIA") || "wheat AND commodity";
const connectionString = envVar("CNN") || "postgres://postgres:asdQWER1234@localhost:5432";
const databaseName = envVar("DATABASE_NAME") || "dataingest__newsapi__default";
const apiKey = requiredEnvVar("API_KEY");

(async function main() {

    const { Client } = pg;

    await ensureDatabase(new Client({ connectionString }));

    const normalClient = new Client({ connectionString: `${connectionString}/${databaseName}` });
    await normalClient.connect();
    await ensureDatabaseTables(normalClient);

    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", criteria);
    url.searchParams.set("apiKey", apiKey);
    const response = await fetch(url);
    const json = await response.json();
    let i = 0;
    let inserts = 0;
    for (const item of json.articles) {
        i++;
        //console.log(`${i} of ${json.totalResults}`);
        const sql = `
            INSERT INTO news_event(title, description, url)
            SELECT $1, $2, $3::VARCHAR
            WHERE NOT EXISTS (SELECT news_event_id FROM news_event WHERE url=$3)
        `;
        const result = await normalClient.query(sql, [item.title, item.description, item.url]);
        inserts += result.rowCount || 0;
    }

    console.log(`INSERTED ${inserts} news items (from ${i} returned)`);

    logRows(await normalClient.query("SELECT * FROM news_event"));

}());


async function ensureDatabaseTables(normalClient: Client) {

    const sql = `CREATE TABLE IF NOT EXISTS news_event(
        news_event_id BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
        event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        title VARCHAR(200) NOT NULL,
        description VARCHAR(1000),
        url VARCHAR(2000) NOT NULL
    )`;
    logRows(await normalClient.query(sql));

}

async function ensureDatabase(client: Client) {
    await client.connect();
    const sql = `
        DO
$do$
DECLARE
  _db TEXT := '${databaseName}';
BEGIN
  CREATE EXTENSION IF NOT EXISTS dblink; -- enable extension
  IF EXISTS (SELECT 1 FROM pg_database WHERE datname = _db) THEN
    RAISE NOTICE 'Database already exists';
  ELSE
    PERFORM dblink_exec('', 'CREATE DATABASE ' || _db);
  END IF;
END
$do$
`;
    logRows(await client.query(sql));
    client.end();
}



