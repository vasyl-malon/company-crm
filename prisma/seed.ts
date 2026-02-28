import { PrismaClient, Role, UserStatus, BranchStatus } from "../generated/prisma/client";
import * as bcrypt from "bcrypt";

import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: "postgresql://neondb_owner:npg_xlMwIL5TQ0Jp@ep-plain-tree-abndqc8g-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding...", process.env.DATABASE_URL);

  // 🔹 1. Branch
  const branch = await prisma.branch.upsert({
    where: { name: "Main Branch" },
    update: {},
    create: {
      name: "Main Branch",
      status: BranchStatus.ACTIVE,
      activatedAt: new Date(),
    },
  });

  // 🔹 2. Department
  const department = await prisma.department.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "IT Department",
    },
  });

  // 🔹 3. Admin user
  const adminPassword = await bcrypt.hash("qwerty123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "vasamalon@gmail.com" },
    update: {},
    create: {
      email: "vasamalon@gmail.com",
      password: adminPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      phoneNumber: "380991112233",
      birthdate: new Date("1990-01-01"),
      firstName: "System",
      lastName: "Admin",
      branchId: branch.id,
      departmentId: department.id,
      jobPosition: "Administrator",
      country: "Ukraine",
      city: "Kyiv",
      gender: "MALE",
      startDate: new Date(),
    },
  });

  // 🔹 4. Regular user
  const userPassword = await bcrypt.hash("User123!", 10);

  const user = await prisma.user.upsert({
    where: { email: "user@crm.local" },
    update: {},
    create: {
      email: "user@crm.local",
      password: userPassword,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      phoneNumber: "380991112244",
      birthdate: new Date("1995-05-10"),
      firstName: "Test",
      lastName: "User",
      branchId: branch.id,
      departmentId: department.id,
      jobPosition: "Developer",
      country: "Ukraine",
      city: "Lviv",
      gender: "MALE",
      startDate: new Date(),
    },
  });

  console.log("✅ Seed completed");
  console.log({ admin, user });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



