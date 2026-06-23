// debug-login.ts — Run: npx tsx scripts/debug-login.ts
import 'dotenv/config';
import { db } from '../src/db/index';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PASS:', process.env.DB_PASS ? '***set***' : 'EMPTY!');

  const [u] = await db.select().from(users).where(eq(users.account, 'admin')).limit(1);
  console.log('user found:', !!u);
  if (u) {
    console.log('passwordHash length:', u.passwordHash.length);
    console.log('passwordHash prefix:', u.passwordHash.substring(0, 10));
    console.log('passwordHash type:', typeof u.passwordHash);
    const ok = await bcrypt.compare('admin123', u.passwordHash);
    console.log('bcrypt compare result:', ok);
  }
}

main().catch(e => { console.error('ERROR:', e.message, e.stack); process.exit(1); });
