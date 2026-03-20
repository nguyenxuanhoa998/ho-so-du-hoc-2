const mysql = require('mysql2');
const crypto = require('crypto');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '1';
const DB_NAME = process.env.DB_NAME || 'du_hoc_db';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Super Admin';
const ADMIN_ROLE = 'admin';
const ADMIN_ROLE_ID = 4;
const ADMIN_STATUS = 'active';

function scryptHash(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
}

async function run() {
  const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });

  db.connect(async (err) => {
    if (err) {
      console.error('MySQL connection error:', err.message);
      process.exit(1);
    }

    try {
      const [rows] = await db.promise().query(
        'SELECT id, role, account_status FROM users WHERE email = ? LIMIT 1',
        [ADMIN_EMAIL]
      );

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = await scryptHash(ADMIN_PASSWORD, salt);

      if (rows.length) {
        const adminId = rows[0].id;
        await db.promise().query(
          'UPDATE users SET full_name = ?, role = ?, role_id = ?, account_status = ?, password_salt = ?, password_hash = ? WHERE id = ?',
          [ADMIN_FULL_NAME, ADMIN_ROLE, ADMIN_ROLE_ID, ADMIN_STATUS, salt, passwordHash, adminId]
        );
        console.log(`Updated admin account: ${ADMIN_EMAIL}`);
      } else {
        await db.promise().query(
          'INSERT INTO users (full_name, email, role, role_id, account_status, password_salt, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [ADMIN_FULL_NAME, ADMIN_EMAIL, ADMIN_ROLE, ADMIN_ROLE_ID, ADMIN_STATUS, salt, passwordHash]
        );
        console.log(`Created admin account: ${ADMIN_EMAIL}`);
      }
      console.log('Password:', ADMIN_PASSWORD);
    } catch (e) {
      console.error('Error:', e.message);
      process.exit(1);
    } finally {
      db.end();
    }
  });
}

run();
