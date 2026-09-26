const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const instantPayoutSettings = [
  { label: "A", baseRate: 0.25, surchargeRate: 1, maxPayoutPercentage: 97.5, isEnabled: true },
  { label: "B", baseRate: 0.5, surchargeRate: 1.25, maxPayoutPercentage: 90, isEnabled: true },
  { label: "C", baseRate: 1, surchargeRate: 0, maxPayoutPercentage: 50, isEnabled: false },
  { label: "D", baseRate: 0, surchargeRate: 0, maxPayoutPercentage: 0, isEnabled: false },
];

(async () => {
  for (const row of instantPayoutSettings) {
    const tier = await prisma.merchantTier.findFirst({
      where: { label: row.label },
      select: { id: true },
    });
    if (!tier) throw new Error(`Merchant tier ${row.label} was not found`);

    const settings = {
      baseRate: row.baseRate,
      surchargeRate: row.surchargeRate,
      maxPayoutPercentage: row.maxPayoutPercentage,
      isEnabled: row.isEnabled,
    };

    await prisma.merchantInstantPayoutSettings.upsert({
      where: { merchantTierId: tier.id },
      update: settings,
      create: { merchantTierId: tier.id, ...settings },
    });
  }

  const rows = await prisma.merchantInstantPayoutSettings.findMany({
    include: { merchantTier: { select: { label: true } } },
    orderBy: { merchantTier: { label: "asc" } },
  });
  console.log(
    rows.map((row) => ({
      tier: row.merchantTier.label,
      baseRate: Number(row.baseRate),
      surchargeRate: Number(row.surchargeRate),
      maxPayoutPercentage: Number(row.maxPayoutPercentage),
      isEnabled: row.isEnabled,
    }))
  );
  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
