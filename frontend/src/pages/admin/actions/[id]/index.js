// frontend/src/pages/admin/actions/[id]/index.js
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../../../components/AdminLayout';
import ActionPublicView from '../../../../components/ActionPublicView';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';

export default function AdminActionView() {
  const router = useRouter();
  const { id } = router.query;

  if (!id) {
    return (
      <AdminLayout title="Acción">
        <p className="text-center py-8">Cargando...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Acción">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/admin/actions');
            }
          }}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <FaArrowLeft className="w-3 h-3" /> Volver a Acciones
        </button>

        <Link
          href={`/admin/actions/${id}/edit`}
          className="inline-flex items-center gap-2 text-sm font-semibold border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-5 py-2.5 rounded-lg hover:bg-fuchsia-50 transition-colors shadow-sm"
        >
          <FaEdit className="w-4 h-4" /> Editar Acción
        </Link>
      </div>

      {/* Barra indicadora */}
      <div className="flex items-center gap-2 px-3 py-1.5 mb-3 text-xs text-gray-500">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        Vista pública · así la verá el visitante
      </div>

      {/* Vista pública embebida */}
      <div className="bg-gradient-to-b from-yellow-50 via-amber-50 to-white rounded-2xl border border-gray-200 overflow-hidden">
        <ActionPublicView id={id} />
      </div>
    </AdminLayout>
  );
}
