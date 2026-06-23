import { Pool } from 'pg';
import { readFileSync } from 'fs';

async function main() {
  const envPath = new URL('../.env', import.meta.url).pathname;
  const envContent = readFileSync(envPath, 'utf-8');
  const env: Record<string, string> = {};
  envContent.split('\n').forEach(l => {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  });

  const pool = new Pool({
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT) || 5432,
    database: env.DB_NAME || 'taskapp',
    user: env.DB_USER || 'postgres',
    password: env.DB_PASS || '',
    ssl: false,
  });

  const r = await pool.query("SELECT account, password_hash IS NOT NULL as has_hash, char_length(password_hash) as hash_len FROM users");
  console.log(JSON.stringify(r.rows, null, 2));

  await pool.end();
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
