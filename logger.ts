import pg from "pg";

export function logResult(results: pg.QueryResult<any>) {

    console.log(results.command);
    console.log(results.rowCount);

}

export function logRows(results: pg.QueryResult<any>) {
    for (const result of Array.isArray(results) ? results : [results]) {
        console.log(result.command + ":");
        for (const row of result.rows) {
            console.log(row);
        }
    }
}
