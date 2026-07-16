import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import api from '../../../../lib/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ActionForm from '../../../../components/ActionForm';
import { FaPlus, FaArrowLeft, FaEdit, FaTrash, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'react-calendar/dist/Calendar.css';

const Calendar = dynamic(() => import('react-calendar'), { ssr: false });

const getLocalDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function BDSDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [bds, setBds] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAction, setEditingAction] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Filtros nuevos
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filterCategory, setFilterCategory] = useState('todas');
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);

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

  // Filtrar acciones
  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      const actionDate = new Date(action.datetime);
      // Filtro de categoría
      if (filterCategory !== 'todas' && action.category !== filterCategory) return false;
      // Filtro de fecha desde
      if (fromDate && actionDate < fromDate) return false;
      // Filtro de fecha hasta
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (actionDate > endOfDay) return false;
      }
      return true;
    });
  }, [actions, fromDate, toDate, filterCategory]);

  // Categorías posibles
  const categories = [
    'todas', 'protest', 'march', 'bds', 'solidarity_action', 'workshop', 'webinar', 'talk', 'strike'
  ];

  const categoryLabels = {
    todas: 'Todas',
    protest: 'Protesta',
    march: 'Marcha',
    bds: 'BDS',
    solidarity_action: 'Acción solidaria',
    workshop: 'Taller',
    webinar: 'Webinar',
    talk: 'Charla',
    strike: 'Huelga',
  };

  const clearDates = () => {
    setFromDate(null);
    setToDate(null);
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

      {/* FILTROS AVANZADOS */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>
        </div>

        {/* Selector de categoría */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 focus:ring-2 focus:ring-fuchsia-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
          ))}
        </select>

        {/* Filtro de fecha desde */}
        <div className="relative">
          <button
            onClick={() => setShowFromCalendar(!showFromCalendar)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaCalendarAlt className="text-gray-400" />
            {fromDate ? getLocalDateStr(fromDate) : 'Desde'}
          </button>
          {showFromCalendar && (
            <div className="absolute z-10 mt-1 bg-white border rounded-lg shadow-lg">
              <Calendar
                onChange={(value) => { setFromDate(value); setShowFromCalendar(false); }}
                value={fromDate}
                className="border-0"
              />
            </div>
          )}
        </div>

        {/* Filtro de fecha hasta */}
        <div className="relative">
          <button
            onClick={() => setShowToCalendar(!showToCalendar)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaCalendarAlt className="text-gray-400" />
            {toDate ? getLocalDateStr(toDate) : 'Hasta'}
          </button>
          {showToCalendar && (
            <div className="absolute z-10 mt-1 bg-white border rounded-lg shadow-lg">
              <Calendar
                onChange={(value) => { setToDate(value); setShowToCalendar(false); }}
                value={toDate}
                className="border-0"
              />
            </div>
          )}
        </div>

        {(fromDate || toDate) && (
          <button onClick={clearDates} className="text-xs text-red-600 hover:underline">
            Limpiar fechas
          </button>
        )}
      </div>

      {/* Tabla de acciones personalizada */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredActions.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No hay acciones que coincidan con los filtros.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredActions.map(action => (
                <tr key={action.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{action.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      {categoryLabels[action.category] || action.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(action.datetime).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {action.locationType === 'online' ? '💻 Online' : '📍 Presencial'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      onClick={() => { setEditingAction(action); setShowForm(true); }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <FaEdit className="inline" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(action.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash className="inline" /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}