/**
 * Seeding de datos DEMO para desarrollo local.
 * Idempotente: crea solo si la tabla está vacía.
 *
 * Uso: node scripts/seed-demo.js
 */
const bcrypt = require('bcryptjs');
const {
  User, Campaign, Action, BDS, News, Report, Petition,
} = require('../src/models');

async function seed() {
  try {
    console.log('🌱 Sembrando datos demo...\n');

    // ─── 1. Admin ──────────────────────────────────────────────
    let admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      const hash = await bcrypt.hash('admin123', 10);
      admin = await User.create({
        username: 'admin',
        email: 'admin@lunaroja.local',
        password: hash,
        role: 'superadmin',
        active: true,
      });
      console.log('✅ Admin creado (admin / admin123)');
    } else {
      console.log('ℹ️  Admin ya existe');
    }

    // ─── 2. Campañas ───────────────────────────────────────────
    if ((await Campaign.count()) === 0) {
      const campaigns = await Campaign.bulkCreate([
        { name: 'Boicot a productos israelíes', description: 'Campaña de boicot BDS.', color: '#E30613', visible: true, status: 'published' },
        { name: 'Solidaridad con Palestina', description: 'Acciones de solidaridad y apoyo.', color: '#009639', visible: true, status: 'published' },
        { name: 'Justicia para Gaza', description: 'Exigimos el fin del genocidio.', color: '#000000', visible: true, status: 'published' },
      ]);
      console.log(`✅ ${campaigns.length} campañas creadas`);
    } else {
      console.log(`ℹ️  Campañas ya existen`);
    }

    // ─── 3. BDS ────────────────────────────────────────────────
    if ((await BDS.count()) === 0) {
      const bds = await BDS.bulkCreate([
        { name: 'HP', description: 'Empresa suministradora del ejército israelí.', color: '#009DE0', visible: true, status: 'published' },
        { name: 'Puma', description: 'Patrocina equipos deportivos en asentamientos.', color: '#000000', visible: true, status: 'published' },
        { name: 'SodaStream', description: 'Opera en territorio ocupado.', color: '#E30613', visible: true, status: 'published' },
      ]);
      console.log(`✅ ${bds.length} empresas BDS creadas`);
    } else {
      console.log(`ℹ️  BDS ya existen`);
    }

    // ─── 4. Acciones ───────────────────────────────────────────
    if ((await Action.count()) === 0) {
      const campaigns = await Campaign.findAll();
      const bdsList = await BDS.findAll();
      const now = new Date();
      const in10days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      const in20days = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

      const actions = await Action.bulkCreate([
        { title: 'Manifestación en Málaga', description: 'Concentración frente al ayuntamiento.', category: 'protest', datetime: in10days, locationType: 'presencial', address: 'Plaza de la Constitución, Málaga', campaignId: campaigns[0]?.id, status: 'published', urgent: true },
        { title: 'Charla online sobre el BDS', description: 'Webinar con activistas internacionales.', category: 'webinar', datetime: in20days, locationType: 'online', onlineLink: 'https://meet.example.com', campaignId: campaigns[1]?.id, status: 'published' },
        { title: 'Boicot a Puma en tiendas', description: 'Acción informativa en tiendas Puma.', category: 'solidarity_action', datetime: in10days, locationType: 'presencial', address: 'Calle Larios, Málaga', bdsId: bdsList[1]?.id, status: 'published' },
      ]);
      console.log(`✅ ${actions.length} acciones creadas`);
    } else {
      console.log(`ℹ️  Acciones ya existen`);
    }

    // ─── 5. Noticias ───────────────────────────────────────────
    if ((await News.count()) === 0) {
      const campaigns = await Campaign.findAll();
      await News.bulkCreate([
        { title: 'Nuevo informe de Amnistía Internacional', description: 'Amnistía publica informe sobre crímenes de guerra.', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', isNews: true, campaignId: campaigns[0]?.id, publishedAt: new Date() },
        { title: 'Boicot a Carrefour gana fuerza', description: 'Cadenas europeas retiran productos israelíes.', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', isNews: true, campaignId: campaigns[1]?.id, publishedAt: new Date() },
      ]);
      console.log('✅ 2 noticias creadas');
    } else {
      console.log(`ℹ️  Noticias ya existen`);
    }

    // ─── 6. Reportes ───────────────────────────────────────────
    if ((await Report.count()) === 0) {
      await Report.bulkCreate([
        { title: 'Crónica de la manifestación del 15M', description: 'Miles de personas se manifestaron en Málaga.', content: '<p>El pasado 15 de mayo...</p>', type: 'blog', source: 'Equipo LunaRoja', author: 'María García', publishedAt: new Date() },
        { title: 'Informe: presencia de Puma en España', description: 'Análisis de las tiendas Puma en territorio español.', content: '<p>Tras una investigación...</p>', type: 'report', source: 'Observatorio BDS', author: 'Ahmed Khalil', publishedAt: new Date() },
      ]);
      console.log('✅ 2 reportes creados');
    } else {
      console.log(`ℹ️  Reportes ya existen`);
    }

    // ─── 7. Peticiones ─────────────────────────────────────────
    if ((await Petition.count()) === 0) {
      const petition = await Petition.create({
        title: 'Firma por el alto el fuego en Gaza',
        content: '<p>Exigimos al gobierno español que condene...</p>',
        description: 'Petición urgente para pedir el alto el fuego.',
        target_emails: ['presidente@example.com', 'ministro@example.com'],
        signature_fields: [
          { name: 'nombre', label: 'Nombre completo', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true, unique: true },
        ],
        type: 'custom',
        urgency: true,
        created_by: admin.id,
      });
      console.log(`✅ Petición creada: ${petition.title}`);
    } else {
      console.log(`ℹ️  Peticiones ya existen`);
    }

    console.log('\n🎉 Seeding completado.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seeding:', err);
    process.exit(1);
  }
}

seed();
