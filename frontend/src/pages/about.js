import Layout from '../components/Layout';

export default function About() {
  return (
    <Layout title="Acerca de - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 py-12 flex flex-col justify-center items-center min-h-[70vh]">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl font-bold mb-8 text-gray-600">Acerca de Voces Palestinas por la Justicia</h1>
          <div className="space-y-4 text-gray-700">
            <p>
              Voces Palestinas por la Justicia es una asociación de iniciativa ciudadana que busca visibilizar y generar conciencia sobre la causa palestina.
              Creemos en el poder de la información y la comunidad para impulsar cambios positivos.
            </p>
            <h2 className="text-2xl font-semibold mt-6 text-gray-600">Nuestra misión</h2>
            <p>
              Proveer información clara, verificada y accesible, así como herramientas para que las personas puedan involucrarse y recordar fechas importantes, eventos y acciones relacionadas con la causa.
            </p>
            <h2 className="text-2xl font-semibold mt-6 text-gray-600">Quiénes somos</h2>
            <p>
              Somos un equipo multidisciplinario de voluntarios comprometidos con la transparencia y el impacto social.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}