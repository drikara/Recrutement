import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'Admin.wfm@orange.com';
  const adminPassword = 'Admin@12';


  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`L'utilisateur ${adminEmail} existe déjà.`);
    return;
  }


  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  
  await prisma.$transaction(async (tx) => {
   
    const user = await tx.user.create({
      data: {
        name: 'Admin WFM',
        email: adminEmail,
        emailVerified: true, 
        role: 'WFM',
        isActive: true,
      },
    });

    
    await tx.account.create({
      data: {
        userId: user.id,
        providerId: 'credential',   
        accountId: adminEmail,       
        password: hashedPassword,
      },
    });

    console.log(`Utilisateur admin créé : ${adminEmail}`);
  });
}

main()
  .catch((e) => {
    console.error('Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });