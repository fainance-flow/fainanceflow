import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TARGET_EMAIL = "zumarawan39@gmail.com";

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) {
    console.log(`No user found with email: ${TARGET_EMAIL}`);
    return;
  }

  console.log(`Found user: ${user.name} (${user.email})`);

  // Delete all transaction history
  const txDeleted = await prisma.transaction.deleteMany({ where: { userId: user.id } });
  console.log(`✔  Deleted ${txDeleted.count} transactions`);

  // Delete budgets (monthly limits — user will re-add)
  const budgetsDeleted = await prisma.budget.deleteMany({ where: { userId: user.id } });
  console.log(`✔  Deleted ${budgetsDeleted.count} budgets`);

  // Delete goal contributions + goals
  const accounts = await prisma.bankAccount.findMany({ where: { userId: user.id } });
  const goals = await prisma.goal.findMany({ where: { userId: user.id } });
  for (const g of goals) {
    await prisma.goalContribution.deleteMany({ where: { goalId: g.id } });
  }
  const goalsDeleted = await prisma.goal.deleteMany({ where: { userId: user.id } });
  console.log(`✔  Deleted ${goalsDeleted.count} goals`);

  // Reset all account balances to 0
  for (const acc of accounts) {
    await prisma.bankAccount.update({
      where: { id: acc.id },
      data: { balance: 0 },
    });
  }
  console.log(`✔  Reset balance to 0 on ${accounts.length} accounts: ${accounts.map(a => a.bankName).join(", ")}`);

  console.log(`\n✅  Done. Now set the correct opening balance on each account from the app.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
