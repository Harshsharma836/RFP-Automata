const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function verifyTables() {
  try {
    const result = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );

    console.log('\n📊 Database Tables Created:');
    console.log('─'.repeat(40));
    result.rows.forEach(row => {
      console.log(`✓ ${row.table_name}`);
    });

    // Show column info for each table
    for (const table of result.rows) {
      const columns = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
        [table.table_name]
      );
      console.log(`\n📋 ${table.table_name}:`);
      columns.rows.forEach(col => {
        console.log(`   • ${col.column_name}: ${col.data_type}`);
      });
    }

    console.log('\n✅ Database is ready!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

verifyTables();
