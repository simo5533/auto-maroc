import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cars = await prisma.car.findMany({
    select: { id: true, brandAr: true, modelAr: true, year: true, versionAr: true },
    orderBy: [{ brandAr: "asc" }, { modelAr: "asc" }],
    take: 2000,
  });
  console.log(JSON.stringify(cars, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
