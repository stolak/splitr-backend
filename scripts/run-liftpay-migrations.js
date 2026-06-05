const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runsplitrMigrations() {
  try {
    console.log('🚀 Starting splitr ID system setup...\n');

    // Step 1: Create sequence table
    console.log('📊 Creating splitr_sequence table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS splitr_sequence (
        prefix VARCHAR(10) NOT NULL,
        \`year_month\` CHAR(4) NOT NULL,
        seq INT NOT NULL DEFAULT 100000,
        PRIMARY KEY (prefix, \`year_month\`)
      )
    `;
    console.log('✅ splitr_sequence table created\n');

    // Step 2: Create splitr ID function
    console.log('🔧 Creating generate_splitr_id function...');
    await prisma.$executeRaw`
      DROP FUNCTION IF EXISTS generate_splitr_id
    `;
    
    await prisma.$executeRaw`
      CREATE FUNCTION generate_splitr_id(p_prefix VARCHAR(10))
      RETURNS VARCHAR(30)
      BEGIN
        DECLARE v_year CHAR(2);
        DECLARE v_month CHAR(2);
        DECLARE v_yearmonth CHAR(4);
        DECLARE v_seq INT;
        DECLARE v_id VARCHAR(30);

        SET v_year = RIGHT(YEAR(CURDATE()), 2);
        SET v_month = LPAD(MONTH(CURDATE()), 2, '0');
        SET v_yearmonth = CONCAT(v_year, v_month);

        INSERT INTO splitr_sequence (prefix, \`year_month\`, seq)
        VALUES (p_prefix, v_yearmonth, 100001)
        ON DUPLICATE KEY UPDATE seq = seq + 1;

        SELECT seq INTO v_seq FROM splitr_sequence
        WHERE prefix = p_prefix AND \`year_month\` = v_yearmonth;

        SET v_id = CONCAT(p_prefix, '-', v_yearmonth, '-', v_seq);

        RETURN UPPER(v_id);
      END
    `;
    console.log('✅ generate_splitr_id function created\n');

    // Step 3: Create triggers
    console.log('⚡ Creating database triggers...');
    
    // Drop existing triggers if they exist
    await prisma.$executeRaw`DROP TRIGGER IF EXISTS trg_merchant_splitr_id`;
    await prisma.$executeRaw`DROP TRIGGER IF EXISTS trg_buyer_splitr_id`;
    await prisma.$executeRaw`DROP TRIGGER IF EXISTS trg_loan_splitr_id`;
    await prisma.$executeRaw`DROP TRIGGER IF EXISTS trg_loan_transaction_splitr_id`;
    // Create Merchant trigger
    await prisma.$executeRaw`
      CREATE TRIGGER trg_merchant_splitr_id
      BEFORE INSERT ON Merchant
      FOR EACH ROW
      BEGIN
        IF NEW.splitrId IS NULL OR NEW.splitrId = '' THEN
          SET NEW.splitrId = generate_splitr_id('LPM');
        END IF;
      END
    `;
    console.log('✅ Merchant trigger created');

    // Create Buyer trigger
    await prisma.$executeRaw`
      CREATE TRIGGER trg_buyer_splitr_id
      BEFORE INSERT ON Buyer
      FOR EACH ROW
      BEGIN
        IF NEW.splitrId IS NULL OR NEW.splitrId = '' THEN
          SET NEW.splitrId = generate_splitr_id('LPB');
        END IF;
      END
    `;
    console.log('✅ Buyer trigger created\n');

    // Create Loan trigger
    await prisma.$executeRaw`
      CREATE TRIGGER trg_loan_splitr_id
      BEFORE INSERT ON Loan
      FOR EACH ROW
      BEGIN
        IF NEW.splitrId IS NULL OR NEW.splitrId = '' THEN
          SET NEW.splitrId = generate_splitr_id('LPL');
        END IF;
      END
    `;
    console.log('✅ Loan trigger created\n');

    // Create Loan Transaction trigger
    await prisma.$executeRaw`
      CREATE TRIGGER trg_loan_transaction_splitr_id
      BEFORE INSERT ON LoanTransaction
      FOR EACH ROW
      BEGIN
        IF NEW.splitrId IS NULL OR NEW.splitrId = '' THEN
          SET NEW.splitrId = generate_splitr_id('LPP');
        END IF;
      END
    `;
    console.log('✅ Loan Transaction trigger created\n');

    // Step 4: Test the function
    console.log('🧪 Testing splitr ID generation...');
    const testMerchant = await prisma.$queryRaw`SELECT generate_splitr_id('LPM') as id`;
    const testBuyer = await prisma.$queryRaw`SELECT generate_splitr_id('LPB') as id`;
  
    const testLoan = await prisma.$queryRaw`SELECT generate_splitr_id('LPL') as id`;
    const testLoanTransaction = await prisma.$queryRaw`SELECT generate_splitr_id('LPP') as id`;
    console.log(`✅ Test Merchant ID: ${testMerchant[0].id}`);
    console.log(`✅ Test Buyer ID: ${testBuyer[0].id}`);
    console.log(`✅ Test Loan ID: ${testLoan[0].id}`);
    console.log(`✅ Test Loan Transaction ID: ${testLoanTransaction[0].id}\n`);

    // Step 5: Show statistics
    console.log('📈 Current sequence statistics:');
    const stats = await prisma.$queryRaw`
      SELECT prefix, \`year_month\`, seq FROM splitr_sequence ORDER BY prefix, \`year_month\`
    `;
    
    if (stats.length > 0) {
      stats.forEach(stat => {
        console.log(`   ${stat.prefix} - ${stat.year_month}: ${stat.seq}`);
      });
    } else {
      console.log('   No sequences found');
    }

    console.log('\n🎉 splitr ID system setup completed successfully!');
    console.log('\n📋 Available prefixes:');
    console.log('   LPM - splitr Merchant');
    console.log('   LPB - splitr Buyer');
    console.log('   LPL - splitr Loan');
    console.log('   LPP - splitr Payment');
    console.log('   LPI - splitr Invoice (for future use)');

  } catch (error) {
    console.error('❌ Error setting up splitr ID system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migrations
runsplitrMigrations()
  .then(() => {
    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
