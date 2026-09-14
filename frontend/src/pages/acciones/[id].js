// frontend/src/pages/acciones/[id].js
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ActionPublicView from '../../components/ActionPublicView';

export default function AccionDetalle() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <Layout
      title="Acción"
      bgClass="bg-gradient-to-b from-yellow-100 via-amber-50 to-white min-h-screen"
    >
      {id ? (
        <ActionPublicView id={id} />
      ) : (
        <p className="text-center py-20">Cargando...</p>
      )}
    </Layout>
  );
}
