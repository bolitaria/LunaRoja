import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import api from '../../../../lib/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ActionForm from '../../../../components/ActionForm';
import ActionTable from '../../../../components/ActionTable';
import { FaPlus, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

export default function BDSDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [bds, setBds] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAction, setEditingAction] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    try {
      const [bdsRes, actionsRes] = await Promise.all([
        api.get(`/bds/${id}`),
        api.get(`/actions?bdsId=${id}`)
      ]);
      setBds(bdsRes.data);
      setActions(actionsRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleCreate = async (formData) => {
    try {
      await api.post('/actions', { ...formData, bdsId: id });
      toast.success('Acción creada');
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error('Error al crear acción');
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await api.put(`/actions/${editingAction.id}`, { ...formData, bdsId: id });
      toast.success('Acción actualizada');
      setEditingAction(null);
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error('Error al actualizar acción');
    }
  };

  const handleDelete = async (actionId) => {
    if (!confirm('¿Eliminar esta acción?')) return;
    try {
      await api.delete(`/actions/${actionId}`);
      toast.success('Acción eliminada');
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar acción');
    }
  };

  if (loading) return <AdminLayout title="Cargando..."><p className="text-center py-8">Cargando...</p></AdminLayout>;
  if (!bds) return <AdminLayout title="No encontrada"><p className="text-center py-8 text-red-600">Campaña BDS no encontrada</p></AdminLayout>;

  return (
    <AdminLayout title={`BDS: ${bds.name}`}>
      <ToastContainer />
      <button onClick={() => router.push('/admin/bds')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <FaArrowLeft /> Volver a lista
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full" style={{ backgroundColor: bds.color }} />
          <h1 className="text-2xl font-bold text-gray-800">{bds.name}</h1>
        </div>
        {bds.description && <p className="text-gray-600 mt-2">{bds.description}</p>}
        <div className="mt-4 flex gap-4">
          <Link href={`/admin/bds/${bds.id}/edit`} className="text-sm text-fuchsia-600 hover:text-fuchsia-800">Editar campaña</Link>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Acciones de la campaña</h2>
        <button
          onClick={() => { setEditingAction(null); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 text-sm bg-fuchsia-600 text-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-700 transition-colors"
        >
          <FaPlus className="w-3.5 h-3.5" /> Nueva Acción
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <ActionForm
            initialData={editingAction || {}}
            onSubmit={editingAction ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingAction(null); }}
            hideCampaignSelect={true}
          />
        </div>
      )}

      <ActionTable
        actions={actions}
        onEdit={(action) => { setEditingAction(action); setShowForm(true); }}
        onDelete={handleDelete}
        campaignMap={{}}
        showCampaignColumn={false}
        showBdsColumn={false}
      />
    </AdminLayout>
  );
}