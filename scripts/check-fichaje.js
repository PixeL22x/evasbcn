const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.registroHorario.findMany({
    orderBy: { entrada: 'desc' },
    take: 5
  });
  console.log('Recent records:', records);
  await prisma.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await prisma.$disconnect();
});
