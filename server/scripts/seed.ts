import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'taskapp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
});

async function seed() {
  console.log('Seeding database...');

  // Create org
  const [org] = (await pool.query(
    `INSERT INTO organizations (name, code) VALUES ($1, $2) ON CONFLICT (code) DO UPDATE SET name = $1 RETURNING id`,
    ['默认组织', 'default']
  )).rows;
  console.log('Organization created:', org.id);

  // Create admin user (password: admin123)
  const passwordHash = await bcrypt.hash('admin123', 10);
  const [user] = (await pool.query(
    `INSERT INTO users (account, name, email, password_hash, org_id, role) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (account) DO UPDATE SET name = $2 RETURNING id`,
    ['admin', '管理员', 'admin@taskapp.local', passwordHash, org.id, 'admin']
  )).rows;
  console.log('Admin user created:', user.id, '(account: admin, password: admin123)');

  await pool.end();
  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
