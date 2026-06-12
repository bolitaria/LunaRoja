import Layout from '../components/Layout';

export default function About() {
  return (
    <Layout title="Acerca de - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Acerca de Voces Palestinas por la Justicia</h1>
        <div className="max-w-3xl mx-auto prose lg:prose-xl">
          <p>
            Voces Palestinas por la Justicia es una asociación de iniciativa ciudadana que busca visibilizar y generar conciencia sobre [tu causa].
            Creemos en el poder de la información y la comunidad para impulsar cambios positivos.
          </p>
          <h2>Nuestra misión</h2>
          <p>
            Proveer información clara, verificada y accesible, así como herramientas para que las personas puedan involucrarse y recordar fechas importantes, eventos y acciones relacionadas con la causa.
          </p>
          <h2>Quiénes somos</h2>
          <p>
            Somos un equipo multidisciplinario de voluntarios comprometidos con la transparencia y el impacto social.
          </p>
        </div>
      </div>
    </Layout>
  );
}