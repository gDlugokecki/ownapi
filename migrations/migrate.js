import Postgrator from "postgrator";
import pg from "pg";
import path from "path";

async function migrate() {
  console.log(
    Bun.env.DB_HOST,
    Bun.env.DB_PORT,
    Bun.env.DB_NAME,
    Bun.env.DB_USER,
    Bun.env.DB_PASSWORD
  );
  const client = new pg.Client({
    host: Bun.env.DB_HOST,
    port: Bun.env.DB_PORT,
    database: Bun.env.DB_NAME,
    user: Bun.env.DB_USER,
    password: Bun.env.DB_PASSWORD,
  });

  try {
    const postgrator = new Postgrator({
      migrationPattern: path.join(__dirname, "./*"),
      driver: "pg",
      database: Bun.env.DB_NAME,
      currentSchema: "public", // Postgres and MS SQL Server only
      execQuery: (query) => client.query(query),
    });
    await client.connect();
    const result = await postgrator.migrate();

    if (result.length === 0) {
      console.log(
        'No migrations run for schema "public". Already at the latest one.'
      );
    }
    await client.end();
    console.log('Migrations applied')
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}
await migrate();
