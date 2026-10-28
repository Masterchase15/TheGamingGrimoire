// Grants (or with --revoke, removes) the admin role for an existing account.
// Admins can use the admin API from the browser while signed in.
//   npm run make-admin -- <username or email> [--revoke]
// Uses DATABASE_URL from .env; the local database must be running (start.bat).
import { migrate } from '../server/src/db/migrate.js';
import { pool } from '../server/src/db/pool.js';

const args = process.argv.slice(2);
const revoke = args.includes('--revoke');
const who = args.find((a) => !a.startsWith('--'));
if (!who) {
  console.error('Usage: npm run make-admin -- <username or email> [--revoke]');
  process.exit(1);
}

try {
  await migrate(); // make sure the role column exists
  const { rows } = await pool.query(
    `UPDATE "user" SET role = $2 WHERE lower(username) = lower($1) OR lower(email) = lower($1)
     RETURNING username, email`,
    [who, revoke ? 'user' : 'admin']
  );
  if (!rows.length) {
    console.error(`No account found for "${who}". Sign up on the site first.`);
    process.exitCode = 1;
  } else {
    console.log(`${rows[0].username ?? rows[0].email} is ${revoke ? 'no longer an admin' : 'now an admin'}.`);
  }
} catch (err) {
  console.error(`Could not update the account: ${err.message}`);
  if (err.code === 'ECONNREFUSED') console.error('Is the database running? Start the site with start.bat first.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
