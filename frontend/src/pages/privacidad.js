import Layout from '../components/Layout';

export default function Privacidad() {
  return (
    <Layout title="Política de Privacidad - Voces Palestina por la Justicia">
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Encabezado con línea verde centrada */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-700 tracking-tight">
              Política de Privacidad
            </h1>
            <div className="h-1 w-full max-w-xs mx-auto bg-green-600 mt-3"></div>
            <p className="mt-4 text-sm text-gray-500">
              Última actualización: 9 de julio de 2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-10">
            <p>
              Somos <strong>Voces Palestina por la Justicia</strong>, un colectivo de conciencia y acción política y social que se levanta frente al silencio impuesto y la normalización de la injusticia. Respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política explica qué información recogemos a través de nuestra app, cómo la utilizamos y qué derechos te asisten.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-red-700 mb-4 border-b border-gray-200 pb-2">
                1. Información que recogemos
              </h2>
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">
                Suscripción al boletín
              </h3>
              <p>Cuando te suscribes a nuestro boletín de noticias, recopilamos:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Tu dirección de correo electrónico.</li>
                <li>Tu nombre (si decides facilitarlo).</li>
                <li>Tu país o región (si decides indicarlo).</li>
              </ul>
              <p className="mt-2">
                También podemos recoger información técnica básica, como el tipo de dispositivo, sistema operativo y la fecha de suscripción, con el único fin de mantener correctamente nuestra lista de correo.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">
                Firma de peticiones
              </h3>
              <p>
                Al firmar una petición, podemos solicitar datos como nombre, correo electrónico y país para validar tu firma y darle legitimidad. <strong>No almacenamos estos datos en nuestra base de datos</strong> una vez que la petición ha sido entregada a su destinatario. La única excepción es si, durante el proceso de firma, decides voluntariamente suscribirte a nuestro boletín; en ese caso conservaremos exclusivamente tu correo electrónico (y tu nombre y país si los facilitaste para el boletín) conforme al apartado anterior.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-red-700 mb-4 border-b border-gray-200 pb-2">
                2. Cómo utilizamos tu información
              </h2>
              <p>Utilizamos tus datos únicamente para:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Enviarte actualizaciones, noticias, campañas e iniciativas solidarias de Voces Palestina por la Justicia.</li>
                <li>Responder a las consultas que nos envíes.</li>
                <li>Procesar y contabilizar tu firma en las peticiones, sin conservar tus datos personales después de su entrega.</li>
              </ul>
              <p className="mt-2">
                No vendemos, alquilamos ni compartimos tu información personal con terceros con fines comerciales o de marketing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-red-700 mb-4 border-b border-gray-200 pb-2">
                3. Conservación de los datos
              </h2>
              <p>
                <strong>Suscriptores:</strong> Mantenemos tu información mientras permanezcas suscrito al boletín. Puedes darte de baja en cualquier momento mediante el enlace de cancelación que aparece en cada correo electrónico, o contactando con nosotros directamente. Una vez tramitada tu baja, eliminaremos tus datos de nuestra lista activa en un plazo máximo de 30 días.
              </p>
              <p className="mt-2">
                <strong>Firmantes de peticiones:</strong> No conservamos tu nombre, correo electrónico ni país tras la entrega de la petición, salvo que te hayas suscrito al boletín durante el proceso de firma. En ese caso, solo guardaremos los datos correspondientes a la suscripción.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-red-700 mb-4 border-b border-gray-200 pb-2">
                4. Seguridad de los datos
              </h2>
              <p>
                Aplicamos medidas técnicas y organizativas razonables para proteger tus datos personales frente a accesos no autorizados, pérdidas o usos indebidos. Todas las comunicaciones con nuestros servidores se realizan a través de conexiones cifradas (HTTPS).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-red-700 mb-4 border-b border-gray-200 pb-2">
                5. Tus derechos
              </h2>
              <p>Tienes derecho a:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Acceder a los datos personales que conservamos sobre ti.</li>
                <li>Solicitar la rectificación de los datos inexactos.</li>
                <li>Solicitar la supresión de tus datos.</li>
                <li>Retirar tu consentimiento en cualquier momento (por ejemplo, dándote de baja del boletín).</li>
              </ul>
              <p className="mt-2">
                Para ejercer cualquiera de estos derechos, escríbenos a la dirección de contacto indicada más abajo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-red-700 mb-4 border-b border-gray-200 pb-2">
                6. Cookies y tecnologías similares
              </h2>
              <p>
                Nuestra app (y la versión web asociada, si la hubiera) utiliza únicamente elementos técnicos esenciales para su funcionamiento. No empleamos cookies de rastreo, publicitarias ni de análisis de comportamiento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-red-700 mb-4 border-b border-gray-200 pb-2">
                7. Cambios en esta política
              </h2>
              <p>
                Podemos actualizar esta Política de Privacidad ocasionalmente. Cualquier modificación se publicará en esta misma sección con una nueva fecha de actualización. Te recomendamos que revises este texto periódicamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-red-700 mb-4 border-b border-gray-200 pb-2">
                8. Contacto
              </h2>
              <p>
                Si tienes alguna pregunta sobre esta política o sobre cómo tratamos tus datos, puedes contactar con nosotros en:
              </p>
              <p className="mt-2">
                <a
                  href="mailto:contacto@vocespalestinaporlajusticia.org"
                  className="text-red-600 hover:underline"
                >
                  contacto@vocespalestinaporlajusticia.org
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}