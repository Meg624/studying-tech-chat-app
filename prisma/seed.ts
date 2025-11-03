import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Prisma スキーマで authId が必須になっているため、追加する
  await prisma.user.create({
    data: {
      authId: 'seed-auth-id-001',
      name: 'Seed User',
      email: 'seeduser@example.com',
    },
  })

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
