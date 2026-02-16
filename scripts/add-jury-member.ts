// scripts/add-jury-member.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'IfvzOCWR2n0uwRUGVpU0HWQNV8BOeuOG'; // L'ID de votre utilisateur

  console.log('🔍 Vérification de l\'utilisateur...');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { juryMember: true }
  });

  if (!user) {
    console.log('❌ Utilisateur introuvable');
    return;
  }

  console.log('📊 Utilisateur trouvé:');
  console.log('  - Email:', user.email);
  console.log('  - Nom:', user.name);
  console.log('  - Rôle:', user.role);
  console.log('  - JuryMember:', user.juryMember ? '✅ Existe' : '❌ Manquant');

  if (user.juryMember) {
    console.log('\n⚠️  Le profil JuryMember existe déjà!');
    console.log('  - RoleType:', user.juryMember.roleType);
    
    if (user.juryMember.roleType !== 'WFM_JURY') {
      console.log('\n🔄 Mise à jour vers WFM_JURY...');
      await prisma.juryMember.update({
        where: { id: user.juryMember.id },
        data: { roleType: 'WFM_JURY' }
      });
      console.log('✅ RoleType mis à jour!');
    }
  } else {
    console.log('\n➕ Création du profil JuryMember...');
    
    await prisma.juryMember.create({
      data: {
        userId: user.id,
        fullName: user.name || 'Admin WFM',
        roleType: 'WFM_JURY',
        isActive: true,
        notes: 'Administrateur WFM principal'
      }
    });

    console.log('✅ Profil JuryMember créé avec succès!');
  }

  // Supprimer les sessions pour forcer une reconnexion
  console.log('\n🔒 Suppression des sessions...');
  const deleted = await prisma.session.deleteMany({
    where: { userId: user.id }
  });
  console.log(`✅ ${deleted.count} session(s) supprimée(s)`);

  // Vérifier le résultat final
  const updated = await prisma.user.findUnique({
    where: { id: userId },
    include: { juryMember: true }
  });

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   ✅ PROFIL COMPLÉTÉ AVEC SUCCÈS      ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`📧 Email:     ${updated?.email}`);
  console.log(`🎭 Rôle:      ${updated?.role}`);
  console.log(`👔 RoleType:  ${updated?.juryMember?.roleType}`);
  console.log(`🆔 User ID:   ${updated?.id}`);
  console.log(`🎯 Jury ID:   ${updated?.juryMember?.id}`);
  console.log('╚════════════════════════════════════════╝\n');

  console.log('🎉 TERMINÉ! Vous pouvez maintenant:');
  console.log('   1. Redémarrer votre serveur (Ctrl+C puis npm run dev)');
  console.log('   2. Vider les cookies du navigateur');
  console.log('   3. Vous reconnecter avec:');
  console.log('      Email: admin.wfm@orange.com');
  console.log('      Mot de passe: Admin@12');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });