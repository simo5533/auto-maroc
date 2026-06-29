import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const r = await prisma.carSpecs.updateMany({
    data: {
      viewer3dExteriorUrl: null,
      viewer3dInteriorUrl: null,
    },
  });
  console.log(`Liens 3D supprimés sur ${r.count} fiche(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
