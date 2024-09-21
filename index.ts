import pg from "pg";
import { trace } from "./instrumentation.js";
import { connectionString, databaseName, criteria, apiKey, ns, version } from "./config.js";
import { Span } from "@opentelemetry/api";

const { Client } = pg;
const tracer = trace.getTracer(`${ns}__main`, version);

await ensureDatabase(new Client({ connectionString }));

const normalClient = new Client({ connectionString: `${connectionString}/${databaseName}` });
await normalClient.connect();
await ensureDatabaseTables(normalClient);

const url = new URL("https://newsapi.org/v2/everything");
url.searchParams.set("q", criteria);
url.searchParams.set("apiKey", apiKey);

await tracer.startActiveSpan("Calling API", async span => {

    try {

        await main(span);

    } catch (err: any) {

        span.recordException(err);

    } finally {

        span.end();

    }

});

async function main(span: Span) {

    const response = await fetch(url);
    const json = await response.json();
    span.addEvent(`${json?.articles?.length} results returned`);

    let inserts = 0;
    for (const item of json.articles) {

        const result = await insertArticle(item);
        inserts += result.rowCount || 0;

    }
    span.addEvent(`Added ${inserts} news items`);

    const row = await countEvents();
    span.addEvent(
        `${row.count} total records (${describeDate(row.first)} -> ${describeDate(row.last)})`,
        {
            count: Number(row.count),
            first: row.first?.toISOString(),
            last: row.last?.toISOString()
        }
    );

}

async function countEvents() {

    const result = await normalClient.query(
        `
            SELECT MIN(event_date) as first, MAX(event_date) as last, COUNT(1)
            FROM news_event
        `
    );
    return result.rows[0];

}

async function insertArticle(item: any) {

    return await normalClient.query(
        `
            INSERT INTO news_event(title, description, url)
            SELECT $1, $2, $3::VARCHAR
            WHERE NOT EXISTS (SELECT news_event_id FROM news_event WHERE url=$3)
        `,
        [item.title, item.description, item.url]
    );

}

function describeDate(x: Date): string {

    return `${x.toDateString()} ${x.toLocaleTimeString()}`;

}

async function ensureDatabaseTables(normalClient: pg.Client) {

    await normalClient.query(
        `
            CREATE TABLE IF NOT EXISTS news_event(
                news_event_id BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
                event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                title VARCHAR(200) NOT NULL,
                description VARCHAR(1000),
                url VARCHAR(2000) NOT NULL
            )
        `
    );

}

async function ensureDatabase(client: pg.Client) {

    await client.connect();
    await client.query(
        `
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
        `
    );
    client.end();

}



