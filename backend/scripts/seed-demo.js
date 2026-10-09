/**
 * Seeding de datos DEMO para desarrollo local.
 * Idempotente: crea solo si la tabla está vacía.
 *
 * Uso: node scripts/seed-demo.js
 */
const bcrypt = require('bcryptjs');
const {
  User, Campaign, Action, BDS, News, Report, Petition, Link,
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
        { title: 'Charla online sobre el BDS', description: 'Webinar con activistas internacionales.', category: 'webinar', datetime: in20days, locationType: 'online', onlineLink: 'https://meet.example.com', registrationLink: 'https://forms.gle/ejemplo', campaignId: campaigns[1]?.id, status: 'published' },
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
      const createdReports = await Report.bulkCreate([
        // ─── Informes (type: report) ───
        { title: 'Informe: presencia de Puma en España', description: 'Análisis de las tiendas Puma en territorio español y su vinculación con asentamientos.', content: '<p>Investigación sobre la presencia de Puma en centros comerciales españoles y su relación con el patrocinio de equipos en asentamientos ilegales.</p>', type: 'report', source: 'Observatorio BDS', author: 'Ahmed Khalil', bibliography: [{ url: 'https://bdsmovement.net/puma', source: 'BDS Movement' }, { url: 'https://www.ohchr.org/', source: 'ONU' }], publishedAt: new Date('2026-10-08T21:18:07.916Z') },
        { title: 'Informe: HP y el ejército israelí', description: 'Cómo HP suministra tecnología al aparato militar israelí.', content: '<p>Análisis de los contratos de HP con las Fuerzas de Defensa de Israel y el uso de sus tecnologías en el control de la población palestina.</p>', type: 'report', source: 'Observatorio BDS', author: 'Leila Haddad', bibliography: [{ url: 'https://www.hp.com/', source: 'HP' }, { url: 'https://bdsmovement.net/', source: 'BDS Movement' }], publishedAt: new Date('2026-09-20T10:00:00.000Z') },
        { title: 'Informe: SodaStream y la ocupación', description: 'La fábrica de SodaStream en el asentamiento de Mishor Adumim.', content: '<p>Estudio sobre la planta de producción de SodaStream en territorio ocupado y las condiciones laborales de los trabajadores palestinos.</p>', type: 'report', source: 'Observatorio BDS', author: 'Yousef Mansour', bibliography: [{ url: 'https://bdsmovement.net/sodastream', source: 'BDS Movement' }], publishedAt: new Date('2026-08-15T08:30:00.000Z') },

        // ─── Blogs (type: blog) ───
        { title: 'Crónica de la manifestación del 15M', description: 'Miles de personas se manifestaron en Málaga.', content: '<p>El pasado 15 de mayo, miles de personas se concentraron en la plaza de la Constitución de Málaga para exigir el fin del genocidio en Gaza y el boicot a las empresas cómplices.</p>', type: 'blog', source: 'Equipo LunaRoja', author: 'María García', publishedAt: new Date('2026-10-08T21:18:00.000Z') },
        { title: 'Crónica: boicot en el centro de Madrid', description: 'Jornada de acción frente a las tiendas Puma y HP.', content: '<p>Activistas de LunaRoja realizaron una jornada de concienciación frente a varias tiendas señaladas por BDS en el centro de Madrid.</p>', type: 'blog', source: 'Equipo LunaRoja', author: 'Carlos Ruiz', publishedAt: new Date('2026-09-28T17:00:00.000Z') },
        { title: 'Crónica: charla en la universidad', description: 'Debate sobre BDS en la Facultad de Ciencias Políticas.', content: '<p>Más de 200 estudiantes asistieron a la charla sobre el movimiento BDS y la complicidad española con la ocupación.</p>', type: 'blog', source: 'Equipo LunaRoja', author: 'Nadia Benali', publishedAt: new Date('2026-09-10T19:00:00.000Z') },
      ]);
      console.log(`✅ ${createdReports.length} reportes creados`);
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

    // ─── 8. Links de interés (con regiones) ───────────────────
    if ((await Link.count()) === 0) {
      const linksData = [
        { title: 'BDS Málaga', url: 'https://bdsmalaga.example.com', description: 'Movimiento BDS en Málaga.', category: 'local' },
        { title: 'BDS España', url: 'https://bdsespana.example.com', description: 'Coordinadora estatal BDS.', category: 'nacional' },
        { title: 'BDS Francia', url: 'https://bdsfrance.example.com', description: 'Campaña francesa.', category: 'europeo' },
        { title: 'BDS Irlanda', url: 'https://bdsireland.example.com', description: 'Campaña irlandesa.', category: 'europeo' },
        { title: 'Jewish Voice for Peace', url: 'https://jvp.example.com', description: 'Organización antisionista de EEUU.', category: 'internacional', region: 'norteamerica' },
        { title: 'IfNotNow', url: 'https://ifnotnow.example.com', description: 'Movimiento juvenil estadounidense.', category: 'internacional', region: 'norteamerica' },
        { title: 'BDS Chile', url: 'https://bdschile.example.com', description: 'Campaña chilena.', category: 'internacional', region: 'america_latina' },
        { title: 'BDS Colombia', url: 'https://bdscolombia.example.com', description: 'Campaña colombiana.', category: 'internacional', region: 'america_latina' },
        { title: 'BDS South Africa', url: 'https://bdssa.example.com', description: 'Movimiento sudafricano por Palestina.', category: 'internacional', region: 'africa' },
        { title: 'Argelia por Palestina', url: 'https://argelia-palestina.example.com', description: 'Solidaridad argelina.', category: 'internacional', region: 'africa' },
        { title: 'Palestinian BDS National Committee', url: 'https://bdsmovement.net', description: 'Comité nacional del BDS palestino.', category: 'internacional', region: 'asia_occidental' },
        { title: 'Samidoun', url: 'https://samidoun.example.com', description: 'Red de solidaridad con presos palestinos.', category: 'internacional', region: 'asia_occidental' },
        { title: 'BDS Malasia', url: 'https://bdsmalaysia.example.com', description: 'Campaña malasia.', category: 'internacional', region: 'asia_meridional_oriental' },
        { title: 'BDS Indonesia', url: 'https://bdsindonesia.example.com', description: 'Campaña indonesia.', category: 'internacional', region: 'asia_meridional_oriental' },
        { title: 'BDS Australia', url: 'https://bdsaustralia.example.com', description: 'Campaña australiana.', category: 'internacional', region: 'oceania' },
        { title: 'Los libros de Edward Said', url: 'https://edwardsaid.example.com', description: 'Obras clave sobre Palestina.', category: 'literatura' },
      ];
      await Link.bulkCreate(linksData.map(l => ({ ...l, created_by: admin.id, active: true })));
      console.log(`✅ ${linksData.length} links de interés creados`);
    } else {
      console.log(`ℹ️  Links ya existen`);
    }

    console.log('\n🎉 Seeding completado.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seeding:', err);
    process.exit(1);
  }
}

seed();
