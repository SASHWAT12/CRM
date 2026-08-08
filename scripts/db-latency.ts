import "dotenv/config";
import { Client } from "pg";

async function run(label: string, sql: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  console.time(label);
  const res = await client.query(sql);
  console.timeEnd(label);

  console.log(`${label} rows:`, res.rowCount);

  await client.end();
}

async function main() {
  await run("SELECT 1", "SELECT 1");
  await run("Industry", "SELECT * FROM \"crm_Industry_Type\"");
  await run("Contacts", "SELECT * FROM \"crm_Contacts\"");
}

main().catch(console.error);