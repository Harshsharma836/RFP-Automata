const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not set in .env');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function initDatabase() {
  const client = await pool.connect();
  try {
    const sqlFile = fs.readFileSync('./init.sql', 'utf8');
    console.log('📝 Running database initialization...');
    
    // Split by semicolons and execute each statement
    const statements = sqlFile
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`⏳ Executing: ${statement.substring(0, 50)}...`);
      await client.query(statement);
    }

    console.log('✅ Database initialized successfully!');
    console.log('📋 Tables created:');
    console.log('   - vendors');
    console.log('   - rfps');
    console.log('   - proposals');
    console.log('   - email_sends');
    console.log('\n✨ Ready to use!');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

initDatabase();
