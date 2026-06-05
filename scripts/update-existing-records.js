const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function updateExistingRecords() {
  let connection;
  
  try {
    console.log('🔄 Updating existing records with splitr IDs...\n');

    // Get database connection details from Prisma
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    // Parse the database URL
    const url = new URL(databaseUrl);
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      multipleStatements: true
    };

    console.log(`📡 Connecting to database: ${config.database}@${config.host}:${config.port}`);
    connection = await mysql.createConnection(config);

    // Update existing merchants
    console.log('🏢 Updating existing merchants...');
    const [merchantResult] = await connection.execute(`
      UPDATE Merchant 
      SET splitrId = generate_splitr_id('LPM') 
      WHERE splitrId IS NULL OR splitrId = ''
    `);
    console.log(`✅ Updated ${merchantResult.affectedRows} merchants`);

    // Update existing buyers
    console.log('👤 Updating existing buyers...');
    const [buyerResult] = await connection.execute(`
      UPDATE Buyer 
      SET splitrId = generate_splitr_id('LPB') 
      WHERE splitrId IS NULL OR splitrId = ''
    `);
    console.log(`✅ Updated ${buyerResult.affectedRows} buyers`);

    // Show updated records
    console.log('\n📊 Updated records:');
    const [merchants] = await connection.execute(`
      SELECT id, splitrId, businessName FROM Merchant WHERE splitrId IS NOT NULL
    `);
    
    const [buyers] = await connection.execute(`
      SELECT id, splitrId, firstName, lastName FROM Buyer WHERE splitrId IS NOT NULL
    `);

    console.log('\n🏢 Merchants:');
    merchants.forEach(merchant => {
      console.log(`   ${merchant.splitrId} - ${merchant.businessName}`);
    });

    console.log('\n👤 Buyers:');
    buyers.forEach(buyer => {
      const name = `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || 'Unknown';
      console.log(`   ${buyer.splitrId} - ${name}`);
    });

    console.log('\n🎉 All existing records updated successfully!');

  } catch (error) {
    console.error('❌ Error updating existing records:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
    await prisma.$disconnect();
  }
}

// Run the update
updateExistingRecords()
  .then(() => {
    console.log('\n✅ Update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });
