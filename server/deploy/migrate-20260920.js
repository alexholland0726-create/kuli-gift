const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value.replace(/\\n/g, '\n');
  }
}

async function hasColumn(db, table, column) {
  const [rows] = await db.execute('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1', [table, column]);
  return rows.length > 0;
}

async function main() {
  loadEnv(process.env.ENV_FILE || path.join(process.cwd(), '.env'));
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'kuli_gift',
    charset: 'utf8mb4',
  });
  try {
    await db.execute("CREATE TABLE IF NOT EXISTS site_settings (`key` varchar(64) NOT NULL, draftJson longtext NOT NULL, publishedJson longtext NOT NULL, version int NOT NULL DEFAULT 1, updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (`key`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    for (const [column, sql] of [
      ['wechatTransactionId', 'ALTER TABLE orders ADD COLUMN wechatTransactionId varchar(64) NULL'],
      ['trackingCompany', 'ALTER TABLE orders ADD COLUMN trackingCompany varchar(80) NULL'],
      ['trackingNo', 'ALTER TABLE orders ADD COLUMN trackingNo varchar(100) NULL'],
    ]) if (!await hasColumn(db, 'orders', column)) await db.execute(sql);
    const [indexes] = await db.execute("SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'UQ_orders_wechatTransactionId' LIMIT 1");
    if (!indexes.length) await db.execute('ALTER TABLE orders ADD UNIQUE KEY UQ_orders_wechatTransactionId (wechatTransactionId)');
    await db.execute("CREATE TABLE IF NOT EXISTS order_audits (id int NOT NULL AUTO_INCREMENT, orderId int NOT NULL, staffId int NOT NULL, action varchar(50) NOT NULL, fromStatus varchar(50) NOT NULL, toStatus varchar(50) NOT NULL, detail text NULL, createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (id), KEY IDX_order_audits_orderId (orderId)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    console.log('MIGRATION_OK 20260920');
  } finally { await db.end(); }
}

main().catch(error => { console.error('MIGRATION_FAILED', error.message); process.exitCode = 1; });
