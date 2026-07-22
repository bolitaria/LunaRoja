import Layout from '../components/Layout';

export default function About() {
  const borderColors = [
    'border-red-500',
    'border-green-500',
    'border-red-500',
    'border-green-500',
    'border-red-500',
    'border-green-500',
    'border-red-500',
  ];

  const sections = [
    {
      title: 'Quiénes somos',
      content: 'Somos Voces Palestinas por la Justicia: un colectivo de conciencia y acción política y social que se levanta frente al silencio impuesto y la normalización de la injusticia. No somos una reacción pasajera ni una emoción momentánea: somos una idea, y las ideas que nacen de la verdad no mueren.',
    },
    {
      title: 'Por qué existimos',
      content: 'Existimos porque la injusticia persiste y la justicia sigue sin cumplirse. Porque frente a la ocupación, el apartheid y la violencia sistemática, el silencio no es neutral: es complicidad. Porque la dignidad y el derecho de autodeterminación de los pueblos no es negociable.',
    },
    {
      title: 'Nuestra posición',
      content: 'Denunciamos sin ambigüedades toda forma de opresión ejercida contra el pueblo palestino. Señalamos la complicidad de quienes sostienen, legitiman o encubren estas estructuras de dominación. Rechazamos cualquier narrativa que pretenda justificar la injusticia o diluir responsabilidades.',
    },
    {
      title: 'Nuestra voz',
      content: 'No pedimos permiso: ejercemos un derecho. Nuestras voces no son una súplica, son una postura política firme. Pueden intentar cercarlas, criminalizarlas o difamarlas, pero cuando una voz nace de la verdad, se multiplica y resiste.',
    },
    {
      title: 'Nuestro compromiso',
      content: 'Seguimos, no porque el camino sea fácil, sino porque retroceder es traición. Porque callar es ser cómplice. Porque la palabra, cuando es honesta, es un acto de resistencia. Unimos nuestra lucha a la de todos los pueblos que resisten frente a la opresión, allí donde haya un derecho negado o una injusticia que combatir.',
    },
    {
      title: 'Nuestra acción',
      content: (
        <>
          <p className="text-lg leading-relaxed text-gray-700 mb-3">
            Nuestra palabra se convierte en acción. Participamos activamente en:
          </p>
          <ul className="list-disc list-inside space-y-2 text-lg leading-relaxed text-gray-700 pl-4 marker:text-red-500">
            <li>Manifestaciones, concentraciones y espacios de movilización social.</li>
            <li>Luchas colectivas por la justicia, dentro y fuera de Palestina.</li>
            <li>Iniciativas de apoyo mutuo y recaudación de fondos para ayudas directas.</li>
            <li>Documentación de nuestra historia y preservación de la memoria como forma de resistencia.</li>
            <li>Intervención en el debate político y social, generando pensamiento crítico y denunciando la injusticia allí donde se manifieste.</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Nuestro horizonte',
      content: 'Nuestro horizonte es claro e innegociable: la libertad, la justicia y la dignidad para el pueblo palestino, y todos los pueblos. Porque mientras exista opresión, existirá resistencia. Porque las ideas que nacen de la verdad no pueden ser derrotadas.',
    },
  ];

  return (
    <Layout title="Acerca de - Voces Palestinas por la Justicia">
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Encabezado con línea verde centrada */}
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-700 tracking-tight">
              Acerca de Voces Palestinas por la Justicia
            </h1>
            <div className="h-1 w-full max-w-xs mx-auto bg-green-600 mt-3"></div>
          </div>

          {/* Contenido en tarjetas */}
          <div className="space-y-10">
            {sections.map((section, index) => {
              const borderColor = borderColors[index % borderColors.length];
              return (
                <section
                  key={index}
                  className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
                >
                  <h2
                    className={`text-2xl md:text-3xl font-bold text-gray-600 border-b-2 ${borderColor} pb-2 inline-block mb-4`}
                  >
                    {section.title}
                  </h2>
                  <div className="text-lg leading-relaxed text-gray-700">
                    {section.content}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}