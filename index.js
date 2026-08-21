const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USER, process.env.COGNODB_PASSWORD)
);

async function testConnection() {
  const session = driver.session();
  try {
    const result = await session.run('RETURN "CognoDB Connection Successful!" AS message');
    console.log(result.records[0].get('message'));
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

testConnection();