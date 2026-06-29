import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { FaEdit, FaTrash, FaPlus, FaFlask } from 'react-icons/fa';

function AdminEmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/email-templates');
      setTemplates(res.data);
    } catch (error) {
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    try {
      await api.delete(`/email-templates/${id}`);
      toast.success('Plantilla eliminada');
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleSendTest = async (id) => {
    try {
      await api.post(`/email-templates/${id}/test`);
      toast.success('Prueba enviada a administradores');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar prueba');
    }
  };

  return (
    <AdminLayout title="Plantillas de Email">
      <ToastContainer />

      {/* Métricas (opcional, podemos mostrar el total) */}
      <div className="bg-amber-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-amber-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Total</span>
          <span className="font-bold text-gray-800">{templates.length}</span>
        </div>
      </div>

      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
        <h2 className="text-2xl font-bold text-gray-800">Plantillas de Email</h2>
        <Link href="/admin/email-templates/new" className="inline-flex items-center gap-1.5 text-sm font-medium border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-4 py-2 rounded-lg hover:bg-fuchsia-50 transition-colors shadow-sm">
          <FaPlus /> Nueva Plantilla
        </Link>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-purple-100 text-sm">
            <thead className="bg-fuchsia-50 text-fuchsia-800 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Asunto</th>
                <th className="px-6 py-3 text-left">Asociado a</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {templates.map(tpl => (
                <tr key={tpl.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{tpl.name}</td>
                  <td className="px-6 py-4 text-gray-500">{tpl.subject}</td>
                  <td className="px-6 py-4 text-gray-500">{tpl.associatedEvent}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tpl.type === 'system' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {tpl.type === 'system' ? 'Sistema' : 'Personalizada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/email-templates/${tpl.id}/edit`} className="p-1.5 text-gray-400 hover:text-fuchsia-600"><FaEdit /></Link>
                      <button onClick={() => handleSendTest(tpl.id)} className="p-1.5 text-gray-400 hover:text-emerald-600"><FaFlask /></button>
                      {tpl.type !== 'system' && (
                        <button onClick={() => handleDelete(tpl.id)} className="p-1.5 text-gray-400 hover:text-red-600"><FaTrash /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminEmailTemplates;