const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USER, process.env.COGNODB_PASSWORD)
);

async function setupDatabase() {
  const session = driver.session();
  try {
    console.log("Wiping partial data in batches...");
    let count = 1;
    while (count > 0) {
      // Delete in batches of 10,000 using Node.js loop control
      const result = await session.run('MATCH (n) WITH n LIMIT 10000 DETACH DELETE n RETURN count(n) as c');
      count = result.records[0].get('c').toNumber();
      console.log(`Deleted ${count} nodes/edges...`);
    }

    console.log("Creating index for fast MERGE...");
    try {
      // Standard Neo4j 4.x/5.x syntax
      await session.run('CREATE INDEX IF NOT EXISTS FOR (p:Paper) ON (p.id)');
    } catch (indexError) {
      // Fallback for Memgraph or older Cypher dialects
      await session.run('CREATE INDEX ON :Paper(id)');
    }
    
    console.log("Database ready for fast ingestion!");
  } catch (error) {
    console.error("Error setting up DB:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

setupDatabase();