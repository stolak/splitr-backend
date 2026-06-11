const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

// Table names from prisma/schema.prisma @@map(...)
const TABLES = {
  splitrSequence: 'splitr_sequence',
  merchant: 'merchant',
  buyer: 'buyer',
  loan: 'loan',
  loanTransaction: 'loan_transaction',
  invoice: 'invoice',
  merchantTransaction: 'merchant_transaction',
};

const SPLITR_ID_PREFIXES = {
  merchant: 'LPM',
  buyer: 'LPB',
  loan: 'LPL',
  loanTransaction: 'LPP',
  invoice: 'LPI',
  merchantTransaction: 'LPMT',
};

// Match Prisma migration default (utf8mb4_unicode_ci)
const DB_COLLATION = 'utf8mb4_unicode_ci';

async function createSplitrTrigger(connection, triggerName, tableName, prefix) {
  await connection.query(`DROP TRIGGER IF EXISTS ${triggerName}`);
  await connection.query(`
    CREATE TRIGGER ${triggerName}
    BEFORE INSERT ON \`${tableName}\`
    FOR EACH ROW
    BEGIN
      IF NEW.splitrId IS NULL OR NEW.splitrId = '' THEN
        SET NEW.splitrId = generate_splitr_id('${prefix}');
      END IF;
    END
  `);
}

async function setupsplitrSystem() {
  let connection;

  try {
    console.log('🚀 Starting splitr ID system setup...\n');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    const url = new URL(databaseUrl);
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      multipleStatements: true,
    };

    console.log(`📡 Connecting to database: ${config.database}@${config.host}:${config.port}`);
    connection = await mysql.createConnection(config);
    await connection.query(`SET NAMES utf8mb4 COLLATE ${DB_COLLATION}`);

    // Step 1: Ensure splitr_sequence table exists (Prisma model: SplitrSequence)
    console.log(`📊 Creating ${TABLES.splitrSequence} table...`);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`${TABLES.splitrSequence}\` (
        prefix VARCHAR(10) NOT NULL,
        \`year_month\` CHAR(4) NOT NULL,
        seq INT NOT NULL DEFAULT 100000,
        PRIMARY KEY (prefix, \`year_month\`)
      ) DEFAULT CHARSET utf8mb4 COLLATE ${DB_COLLATION}
    `);
    await connection.query(`
      ALTER TABLE \`${TABLES.splitrSequence}\`
      CONVERT TO CHARACTER SET utf8mb4 COLLATE ${DB_COLLATION}
    `);
    console.log(`✅ ${TABLES.splitrSequence} table ready\n`);

    // Step 2: Create splitr ID function
    console.log('🔧 Creating generate_splitr_id function...');
    await connection.query(`DROP FUNCTION IF EXISTS generate_splitr_id`);
    await connection.query(`
      CREATE FUNCTION generate_splitr_id(
        p_prefix VARCHAR(10) CHARACTER SET utf8mb4 COLLATE ${DB_COLLATION}
      )
      RETURNS VARCHAR(30) CHARACTER SET utf8mb4 COLLATE ${DB_COLLATION}
      BEGIN
        DECLARE v_year CHAR(2) CHARACTER SET utf8mb4 COLLATE ${DB_COLLATION};
        DECLARE v_month CHAR(2) CHARACTER SET utf8mb4 COLLATE ${DB_COLLATION};
        DECLARE v_yearmonth CHAR(4) CHARACTER SET utf8mb4 COLLATE ${DB_COLLATION};
        DECLARE v_seq INT;
        DECLARE v_id VARCHAR(30) CHARACTER SET utf8mb4 COLLATE ${DB_COLLATION};

        SET v_year = RIGHT(YEAR(CURDATE()), 2);
        SET v_month = LPAD(MONTH(CURDATE()), 2, '0');
        SET v_yearmonth = CONCAT(v_year, v_month);

        INSERT INTO \`${TABLES.splitrSequence}\` (prefix, \`year_month\`, seq)
        VALUES (p_prefix, v_yearmonth, 100001)
        ON DUPLICATE KEY UPDATE seq = seq + 1;

        SELECT seq INTO v_seq FROM \`${TABLES.splitrSequence}\`
        WHERE prefix = p_prefix COLLATE ${DB_COLLATION}
          AND \`year_month\` = v_yearmonth COLLATE ${DB_COLLATION};

        SET v_id = CONCAT(p_prefix, '-', v_yearmonth, '-', v_seq);

        RETURN UPPER(v_id);
      END
    `);
    console.log('✅ generate_splitr_id function created\n');

    // Step 3: Create triggers on snake_case tables from Prisma @@map
    console.log('⚡ Creating database triggers...');

    await createSplitrTrigger(
      connection,
      'trg_merchant_splitr_id',
      TABLES.merchant,
      SPLITR_ID_PREFIXES.merchant,
    );
    console.log(`✅ ${TABLES.merchant} trigger created`);

    await createSplitrTrigger(
      connection,
      'trg_buyer_splitr_id',
      TABLES.buyer,
      SPLITR_ID_PREFIXES.buyer,
    );
    console.log(`✅ ${TABLES.buyer} trigger created`);

    await createSplitrTrigger(
      connection,
      'trg_loan_splitr_id',
      TABLES.loan,
      SPLITR_ID_PREFIXES.loan,
    );
    console.log(`✅ ${TABLES.loan} trigger created`);

    await createSplitrTrigger(
      connection,
      'trg_loan_transaction_splitr_id',
      TABLES.loanTransaction,
      SPLITR_ID_PREFIXES.loanTransaction,
    );
    console.log(`✅ ${TABLES.loanTransaction} trigger created`);

    await createSplitrTrigger(
      connection,
      'trg_invoice_splitr_id',
      TABLES.invoice,
      SPLITR_ID_PREFIXES.invoice,
    );
    console.log(`✅ ${TABLES.invoice} trigger created`);

    await createSplitrTrigger(
      connection,
      'trg_merchant_transaction_splitr_id',
      TABLES.merchantTransaction,
      SPLITR_ID_PREFIXES.merchantTransaction,
    );
    console.log(`✅ ${TABLES.merchantTransaction} trigger created\n`);

    // Step 4: Test the function
    console.log('🧪 Testing splitr ID generation...');
    const [testMerchant] = await connection.execute(
      `SELECT generate_splitr_id('${SPLITR_ID_PREFIXES.merchant}') as id`,
    );
    const [testBuyer] = await connection.execute(
      `SELECT generate_splitr_id('${SPLITR_ID_PREFIXES.buyer}') as id`,
    );
    const [testLoan] = await connection.execute(
      `SELECT generate_splitr_id('${SPLITR_ID_PREFIXES.loan}') as id`,
    );
    const [testLoanTransaction] = await connection.execute(
      `SELECT generate_splitr_id('${SPLITR_ID_PREFIXES.loanTransaction}') as id`,
    );
    const [testInvoice] = await connection.execute(
      `SELECT generate_splitr_id('${SPLITR_ID_PREFIXES.invoice}') as id`,
    );
    const [testMerchantTransaction] = await connection.execute(
      `SELECT generate_splitr_id('${SPLITR_ID_PREFIXES.merchantTransaction}') as id`,
    );

    console.log(`✅ Test Merchant ID: ${testMerchant[0].id}`);
    console.log(`✅ Test Buyer ID: ${testBuyer[0].id}`);
    console.log(`✅ Test Loan ID: ${testLoan[0].id}`);
    console.log(`✅ Test Loan Transaction ID: ${testLoanTransaction[0].id}`);
    console.log(`✅ Test Invoice ID: ${testInvoice[0].id}`);
    console.log(`✅ Test Merchant Transaction ID: ${testMerchantTransaction[0].id}\n`);

    // Step 5: Show statistics
    console.log('📈 Current sequence statistics:');
    const [stats] = await connection.execute(`
      SELECT prefix, \`year_month\`, seq
      FROM \`${TABLES.splitrSequence}\`
      ORDER BY prefix, \`year_month\`
    `);

    if (stats.length > 0) {
      stats.forEach((stat) => {
        console.log(`   ${stat.prefix} - ${stat.year_month}: ${stat.seq}`);
      });
    } else {
      console.log('   No sequences found');
    }

    console.log('\n🎉 splitr ID system setup completed successfully!');
    console.log('\n📋 Available prefixes:');
    console.log(`   ${SPLITR_ID_PREFIXES.merchant}  - splitr Merchant`);
    console.log(`   ${SPLITR_ID_PREFIXES.buyer}  - splitr Buyer`);
    console.log(`   ${SPLITR_ID_PREFIXES.loan}  - splitr Loan`);
    console.log(`   ${SPLITR_ID_PREFIXES.loanTransaction}  - splitr Payment (Loan Transaction)`);
    console.log(`   ${SPLITR_ID_PREFIXES.invoice}  - splitr Invoice`);
    console.log(`   ${SPLITR_ID_PREFIXES.merchantTransaction} - splitr Merchant Transaction`);
  } catch (error) {
    console.error('❌ Error setting up splitr ID system:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
    await prisma.$disconnect();
  }
}

setupsplitrSystem()
  .then(() => {
    console.log('\n✅ All setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
