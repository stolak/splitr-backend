const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const RENAME_TABLES = [
  "merchant",
  "buyer",
  "loan",
  "invoice",
  "loantransaction",
  "merchanttransaction",
  "revenue",
];

async function columnExists(table, column) {
  const rows = await prisma.$queryRaw`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${table}
      AND COLUMN_NAME = ${column}
  `;
  return rows.length > 0;
}

async function main() {
  console.log("Renaming liftpayId -> splitrId...\n");

  for (const table of RENAME_TABLES) {
    const hasLiftpayId = await columnExists(table, "liftpayId");
    const hasSplitrId = await columnExists(table, "splitrId");

    if (hasSplitrId) {
      console.log(`  skip ${table}: splitrId already exists`);
      continue;
    }

    if (!hasLiftpayId) {
      console.log(`  skip ${table}: liftpayId not found`);
      continue;
    }

    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`${table}\` CHANGE \`liftpayId\` \`splitrId\` VARCHAR(30) NOT NULL`,
    );
    console.log(`  renamed ${table}.liftpayId -> splitrId`);
  }

  const hasLogoUrl = await columnExists("merchant", "logoUrl");
  if (!hasLogoUrl) {
    await prisma.$executeRaw`ALTER TABLE merchant ADD COLUMN logoUrl VARCHAR(191) NULL`;
    console.log("\n  added merchant.logoUrl");
  } else {
    console.log("\n  merchant.logoUrl already exists");
  }

  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
