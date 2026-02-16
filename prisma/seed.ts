import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'Admin.wfm@orange.com';
  const adminPassword = 'Admin@12';

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`L'utilisateur ${adminEmail} existe déjà.`);
    return;
  }

  // Hacher le mot de passe
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Créer l'utilisateur et son compte dans une transaction
  await prisma.$transaction(async (tx) => {
    // Créer l'utilisateur avec le rôle WFM
    const user = await tx.user.create({
      data: {
        name: 'Admin WFM',
        email: adminEmail,
        emailVerified: true, // L'admin est vérifié d'office
        role: 'WFM',
        isActive: true,
      },
    });

    // Créer le compte d'authentification (provider = "credential")
    await tx.account.create({
      data: {
        userId: user.id,
        providerId: 'credential',   // ou 'email' selon votre config Better Auth
        accountId: adminEmail,       // identifiant unique pour ce provider
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