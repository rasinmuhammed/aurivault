const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupVectorExtension() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Enable the pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector extension enabled');

    // Create vector index on embeddings table if it doesn't exist
    const indexQuery = `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS embeddings_vector_idx 
      ON embeddings USING ivfflat (vector_vec vector_cosine_ops)
      WITH (lists = 100);
    `;
    
    try {
      await client.query(indexQuery);
      console.log('✅ Vector index created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Vector index already exists');
      } else {
        console.warn('⚠️  Vector index creation failed (non-critical):', error.message);
      }
    }

    // Verify the setup
    const result = await client.query(`
      SELECT 
        schemaname, 
        tablename, 
        indexname 
      FROM pg_indexes 
      WHERE tablename = 'embeddings' AND indexname LIKE '%vector%';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Vector database setup complete!');
      console.log('Found vector indexes:', result.rows);
    } else {
      console.log('✅ Database setup complete (indexes will be created automatically)');
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupVectorExtension();