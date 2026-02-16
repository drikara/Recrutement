// scripts/create-complete-admin.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin.wfm@orange.com';
  const adminPassword = 'Admin@12';

  console.log('🔍 Connexion à la base de données...');
  console.log('📧 Email:', adminEmail);

  // 1. Supprimer l'ancien admin s'il existe
  console.log('\n🧹 Suppression de l\'ancien admin...');
  
  const existing = await prisma.user.findFirst({
    where: {
      email: {
        equals: adminEmail,
        mode: 'insensitive'
      }
    }
  });

  if (existing) {
    console.log(`✅ Utilisateur trouvé avec ID: ${existing.id}`);
    await prisma.user.delete({
      where: { id: existing.id }
    });
    console.log('✅ Ancien utilisateur supprimé');
  } else {
    console.log('ℹ️  Aucun utilisateur existant');
  }

  // 2. Hacher le mot de passe
  console.log('\n🔐 Génération du hash du mot de passe...');
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  console.log('✅ Hash généré:', hashedPassword.substring(0, 30) + '...');

  // 3. Créer tout en une transaction
  console.log('\n💾 Création de l\'admin complet...');
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin WFM',
      email: adminEmail,
      emailVerified: true,
      role: 'JURY',
      isActive: true,
      accounts: {
        create: {
          providerId: 'credential',
          accountId: adminEmail,
          password: hashedPassword,
        }
      },
      juryMember: {
        create: {
          fullName: 'Admin WFM',
          roleType: 'WFM_JURY',
          isActive: true,
          notes: 'Administrateur WFM principal'
        }
      }
    },
    include: {
      accounts: true,
      juryMember: true
    }
  });

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   ✅ ADMIN CRÉÉ AVEC SUCCÈS           ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`📧 Email:        ${admin.email}`);
  console.log(`🔑 Mot de passe: ${adminPassword}`);
  console.log(`🎭 Rôle User:    ${admin.role}`);
  console.log(`👔 Rôle Jury:    ${admin.juryMember?.roleType}`);
  console.log(`🆔 User ID:      ${admin.id}`);
  console.log(`🔐 Accounts:     ${admin.accounts.length} compte(s)`);
  console.log(`🎯 Jury ID:      ${admin.juryMember?.id}`);
  console.log('╚════════════════════════════════════════╝\n');

  // 4. Vérification
  console.log('🔍 Vérification finale...');
  
  const verification = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: {
      accounts: true,
      juryMember: true
    }
  });

  if (verification?.accounts.length === 0) {
    console.log('❌ ERREUR: Aucun compte créé!');
  } else {
    console.log('✅ Compte d\'authentification: OK');
  }

  if (!verification?.juryMember) {
    console.log('❌ ERREUR: Aucun profil JuryMember!');
  } else {
    console.log('✅ Profil JuryMember: OK');
  }

  console.log('\n🎉 TERMINÉ!');
  console.log('Vous pouvez maintenant vous connecter avec:');
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Mot de passe: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error('\n❌ ERREUR:', e.message);
    console.error('\nStack:', e.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n🔌 Déconnexion de Prisma');
  });