// scripts/check-admin-account.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin.wfm@orange.com';

  console.log('🔍 Vérification complète de l\'admin...\n');

  // 1. Chercher l'utilisateur
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: adminEmail,
        mode: 'insensitive'
      }
    },
    include: {
      accounts: true,
      juryMember: true
    }
  });

  if (!user) {
    console.log('❌ AUCUN UTILISATEUR TROUVÉ avec cet email !');
    
    // Lister tous les utilisateurs
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    });
    console.log('\n📋 Tous les utilisateurs dans la DB:');
    console.table(allUsers);
    return;
  }

  console.log('✅ UTILISATEUR TROUVÉ');
  console.log('  - ID:', user.id);
  console.log('  - Email:', user.email);
  console.log('  - Nom:', user.name);
  console.log('  - Rôle:', user.role);
  console.log('  - Email vérifié:', user.emailVerified);
  console.log('  - Actif:', user.isActive);

  console.log('\n🔐 COMPTES D\'AUTHENTIFICATION:');
  if (user.accounts.length === 0) {
    console.log('❌ AUCUN COMPTE ! C\'est le problème !');
    console.log('   L\'utilisateur existe mais n\'a pas de compte credential.');
  } else {
    user.accounts.forEach((account, i) => {
      console.log(`\n  Compte ${i + 1}:`);
      console.log('    - Provider ID:', account.providerId);
      console.log('    - Account ID:', account.accountId);
      console.log('    - A un mot de passe:', account.password ? 'OUI' : 'NON');
      if (account.password) {
        console.log('    - Hash (début):', account.password.substring(0, 20) + '...');
        console.log('    - Type de hash:', account.password.startsWith('$2b$') ? 'bcrypt ✅' : 'INCONNU ❌');
      }
    });
  }

  console.log('\n👔 PROFIL JURY:');
  if (!user.juryMember) {
    console.log('  ℹ️  Aucun profil JuryMember');
  } else {
    console.log('  - ID:', user.juryMember.id);
    console.log('  - Role Type:', user.juryMember.roleType);
    console.log('  - Actif:', user.juryMember.isActive);
  }

  // 2. Tester le hash si disponible
  if (user.accounts.length > 0 && user.accounts[0].password) {
    console.log('\n🧪 TEST DU MOT DE PASSE:');
    const bcrypt = require('bcrypt');
    const testPassword = 'Admin@12';
    
    try {
      const isValid = await bcrypt.compare(testPassword, user.accounts[0].password);
      console.log(`  - Test avec "${testPassword}":`, isValid ? '✅ VALIDE' : '❌ INVALIDE');
      
      if (!isValid) {
        console.log('\n⚠️  LE MOT DE PASSE NE CORRESPOND PAS !');
        console.log('    Soit le hash est incorrect, soit le mot de passe a changé.');
      }
    } catch (error) {
      console.log('  ❌ Erreur lors du test:', error);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());