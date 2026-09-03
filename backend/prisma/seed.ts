import { PrismaClient, AccountType, TransactionType, GoalStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@financeflow.pk";
const DEMO_PASSWORD = "demo123";

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("🌱  Seeding FinanceFlow…");

  // ─── Wipe demo user ─────────────────────────────────────────
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  // ─── User ───────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email: DEMO_EMAIL,
      passwordHash,
      currency: "PKR",
    },
  });
  console.log(`✔  User: ${user.email}`);

  // ─── Bank accounts ──────────────────────────────────────────
  const hbl = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      bankName: "HBL Savings",
      accountType: AccountType.savings,
      balance: 285000,
      color: "#0F6EBD",
      icon: "landmark",
    },
  });

  const meezan = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      bankName: "Meezan Current",
      accountType: AccountType.current,
      balance: 142500,
      color: "#0E7C66",
      icon: "building-2",
    },
  });

  const jazz = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      bankName: "JazzCash Wallet",
      accountType: AccountType.wallet,
      balance: 18750,
      color: "#E60000",
      icon: "wallet",
    },
  });
  console.log("✔  3 bank accounts");

  const accounts = [hbl, meezan, jazz];

  // ─── Transactions (last 2 months) ───────────────────────────
  let txCount = 0;

  // Salary at start of each of the last 2 months
  for (const offsetMonth of [0, 1]) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - offsetMonth);
    await prisma.transaction.create({
      data: {
        userId: user.id,
        bankAccountId: hbl.id,
        type: TransactionType.income,
        amount: 185000,
        category: "Salary",
        description: "Monthly salary",
        date: d,
        tags: ["recurring"],
      },
    });
    txCount++;
  }

  // Freelance income
  await prisma.transaction.create({
    data: {
      userId: user.id,
      bankAccountId: meezan.id,
      type: TransactionType.income,
      amount: 45000,
      category: "Freelance",
      description: "Logo design — Karachi client",
      date: daysAgo(12),
      tags: ["client-work"],
    },
  });
  txCount++;

  // 17 varied expense transactions
  const expenseSeeds: Array<{ category: string; min: number; max: number; desc: string }> = [
    { category: "Food", min: 350, max: 2500, desc: "Karachi Broast / Cheezious / OPTP" },
    { category: "Transport", min: 200, max: 1800, desc: "Careem / fuel / metro" },
    { category: "Shopping", min: 1500, max: 18000, desc: "Khaadi / Outfitters / Daraz" },
    { category: "Bills", min: 3500, max: 14000, desc: "K-Electric / SSGC / PTCL" },
    { category: "Healthcare", min: 800, max: 6000, desc: "Pharmacy / Aga Khan Lab" },
    { category: "Entertainment", min: 600, max: 4500, desc: "Cinepax / Netflix / Sunday brunch" },
  ];

  for (let i = 0; i < 17; i++) {
    const seed = pick(expenseSeeds);
    const account = pick(accounts);
    await prisma.transaction.create({
      data: {
        userId: user.id,
        bankAccountId: account.id,
        type: TransactionType.expense,
        amount: randomBetween(seed.min, seed.max),
        category: seed.category,
        description: seed.desc,
        date: daysAgo(Math.floor(Math.random() * 55)),
        tags: [],
      },
    });
    txCount++;
  }
  console.log(`✔  ${txCount} transactions`);

  // ─── Budgets (current month) ────────────────────────────────
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await prisma.budget.createMany({
    data: [
      { userId: user.id, category: "Food", monthlyLimit: 25000, month, year },
      { userId: user.id, category: "Transport", monthlyLimit: 12000, month, year },
      { userId: user.id, category: "Shopping", monthlyLimit: 20000, month, year },
    ],
  });
  console.log("✔  3 budgets");

  // ─── Goals ──────────────────────────────────────────────────
  const carDeadline = new Date();
  carDeadline.setFullYear(carDeadline.getFullYear() + 2);

  const emergencyDeadline = new Date();
  emergencyDeadline.setMonth(emergencyDeadline.getMonth() + 8);

  const car = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Suzuki Cultus",
      targetAmount: 1500000,
      savedAmount: 320000,
      deadline: carDeadline,
      icon: "car",
      status: GoalStatus.active,
    },
  });

  const emergency = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Emergency Fund",
      targetAmount: 500000,
      savedAmount: 185000,
      deadline: emergencyDeadline,
      icon: "shield",
      status: GoalStatus.active,
    },
  });

  await prisma.goalContribution.createMany({
    data: [
      { goalId: car.id, amount: 50000, note: "Bonus contribution", date: daysAgo(45) },
      { goalId: car.id, amount: 30000, note: "Monthly auto-save", date: daysAgo(15) },
      { goalId: emergency.id, amount: 25000, note: "Monthly auto-save", date: daysAgo(20) },
    ],
  });
  console.log("✔  2 goals + contributions");

  console.log(`\n🚀  Seed complete.\n   email:    ${DEMO_EMAIL}\n   password: ${DEMO_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
