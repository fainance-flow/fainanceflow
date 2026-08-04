import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Clearing all data…");

  const contributions = await prisma.goalContribution.deleteMany();
  console.log(`✔  Deleted ${contributions.count} goal contributions`);

  const goals = await prisma.goal.deleteMany();
  console.log(`✔  Deleted ${goals.count} goals`);

  const budgets = await prisma.budget.deleteMany();
  console.log(`✔  Deleted ${budgets.count} budgets`);

  const transactions = await prisma.transaction.deleteMany();
  console.log(`✔  Deleted ${transactions.count} transactions`);

  const accounts = await prisma.bankAccount.deleteMany();
  console.log(`✔  Deleted ${accounts.count} bank accounts`);

  const users = await prisma.user.deleteMany();
  console.log(`✔  Deleted ${users.count} users`);

  console.log("\n✅  Database cleared. Register a new account to get started.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
