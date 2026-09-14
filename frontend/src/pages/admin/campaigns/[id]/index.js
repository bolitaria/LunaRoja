// frontend/src/pages/admin/campaigns/[id]/index.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-calendar/dist/Calendar.css';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaEdit,
  FaFilter,
  FaFire,
  FaMapMarkerAlt,
  FaSearch,
  FaThList,
  FaTimes,
  FaTimesCircle,
  FaTrash,
} from 'react-icons/fa';
import AdminLayout from '../../../../components/AdminLayout';
import ActionForm from '../../../../components/ActionForm';
import api from '../../../../lib/axios';
import { categoryLabels, categoryStyles } from '../../../../utils/categoryConfig';
import { unwrapList } from '../../../../utils/apiHelpers';

const Calendar = dynamic(() => import('react-calendar'), { ssr: false });

const getLocalDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CampaignDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAction, setEditingAction] = useState(null);
const [showForm, setShowForm] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filterCategory, setFilterCategory] = useState('todas');
  const [filterUrgency, setFilterUrgency] = useState(false);
  const [filterLocationType, setFilterLocationType] = useState('all'); // all | online | presencial
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);

  const allCategories = ['todas', ...Object.keys(categoryLabels)];

  const fetchData = useCallback(async () => {
    try {
      const [campRes, actionsRes] = await Promise.all([
        api.get(`/campaigns/${id}`),
        api.get(`/actions?campaignId=${id}`)
      ]);
      setCampaign(campRes.data);

      const actionsData = actionsRes.data?.data || actionsRes.data || [];
      const sortedActions = Array.isArray(actionsData) ? actionsData.sort(
        (a, b) => new Date(b.datetime) - new Date(a.datetime)
      ) : [];
      setActions(sortedActions);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const handleCreate = async (formData) => {
    try {
      formData.campaignId = id;
      formData.bdsId = '';
      await api.post('/actions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Acción creada');
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error('Error al crear acción');
    }
  };

  const handleUpdate = async (formData) => {
    try {
      formData.campaignId = id;
      await api.put(`/actions/${editingAction.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Acción actualizada');
      setEditingAction(null);
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error('Error al actualizar acción');
    }
  };

  const handleDelete = async (actionId) => {
    if (!confirm('¿Eliminar esta acción? Se eliminarán también sus imágenes asociadas.')) return;
    try {
      await api.delete(`/actions/${actionId}`);
      toast.success('Acción eliminada');
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar acción');
    }
  };

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      // Búsqueda por título
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (!action.title.toLowerCase().includes(term)) return false;
      }
      // Categoría
      if (filterCategory !== 'todas' && action.category !== filterCategory) return false;
      // Urgencia
      if (filterUrgency && !action.urgent) return false;
      // Modalidad
      if (filterLocationType !== 'all' && action.locationType !== filterLocationType) return false;
      // Fechas
      const actionDate = new Date(action.datetime);
      const actionDateStr = getLocalDateStr(actionDate);
      if (fromDate) {
        const fromStr = getLocalDateStr(fromDate);
        if (actionDateStr < fromStr) return false;
      }
      if (toDate) {
        const toStr = getLocalDateStr(toDate);
        if (actionDateStr > toStr) return false;
      }
      return true;
    });
  }, [actions, searchTerm, filterCategory, filterUrgency, filterLocationType, fromDate, toDate]);

  const clearDates = () => {
    setFromDate(null);
    setToDate(null);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCategory('todas');
    setFilterUrgency(false);
    setFilterLocationType('all');
    setFromDate(null);
    setToDate(null);
  };

  const hasActiveFilters = searchTerm || filterCategory !== 'todas' || filterUrgency || filterLocationType !== 'all' || fromDate || toDate;

  if (loading) return <AdminLayout title="Cargando..."><p className="text-center py-8">Cargando...</p></AdminLayout>;
  if (!campaign) return <AdminLayout title="No encontrada"><p className="text-center py-8 text-red-600">Campaña no encontrada</p></AdminLayout>;

  return (
    <AdminLayout title="Editar Campaña">
      <ToastContainer />

      <div className="space-y-6">
        {/* Columna izquierda: información y acciones */}
        <div>
                    <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.history.length > 1) {
                        router.back();
                      } else {
                        router.push('/admin/campaigns');
                      }
                    }}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                  >
                    <FaArrowLeft className="w-3 h-3" /> Volver a Campañas
                  </button>



          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Imagen */}
              <div className="md:col-span-1 flex items-start justify-center">
                {campaign.imageUrl ? (
                  <div className="w-full bg-gray-50 rounded-xl border border-gray-200 p-3 flex items-center justify-center" style={{ minHeight: '320px' }}>
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.name}
                      className="w-full max-h-96 object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400" style={{ minHeight: '320px' }}>
                    Sin imagen
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="md:col-span-2 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-700 truncate">{campaign.name}</h1>
                    <span
                      className="inline-block w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: campaign.color }}
                      title={`Color: ${campaign.color}`}
                    />
                    {campaign.active !== false && (
                      <span className="flex-shrink-0 px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium">
                        Activa
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/admin/campaigns/${campaign.id}/edit`}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-medium border border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors"
                  >
                    <FaEdit className="w-3.5 h-3.5" /> Editar
                  </Link>
                </div>

                {(campaign.subscriberCount > 0 || campaign.actionCount > 0 || campaign.urgentActionCount > 0) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {campaign.subscriberCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-fuchsia-50 text-fuchsia-700 rounded-full border border-fuchsia-200 text-xs font-medium">
                        👥 {campaign.subscriberCount} suscriptores
                      </span>
                    )}
                    {campaign.actionCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 text-xs font-medium">
                        📅 {campaign.actionCount} acciones
                      </span>
                    )}
                    {campaign.urgentActionCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200 text-xs font-medium">
                        🔥 {campaign.urgentActionCount} urgentes
                      </span>
                    )}
                  </div>
                )}

                {campaign.description && (
                  <p className="text-gray-700 text-base whitespace-pre-line mb-4">{campaign.description}</p>
                )}

                {(() => {
                  const validGroups = (campaign.groups || []).filter(g => g.isPublic && g.link);
                  if (validGroups.length === 0) return null;
                  const icons = {
                    whatsapp: <span className="text-lg">💬</span>,
                    telegram: <span className="text-lg">✈️</span>,
                    signal: <span className="text-lg">🔒</span>,
                  };
                  return (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Grupos de mensajería
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {validGroups.map((g, i) => (
                          <a
                            key={i}
                            href={g.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700 transition"
                          >
                            {icons[g.platform] || icons.whatsapp}
                            <span className="capitalize">{g.platform}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-auto pt-4 space-y-3">
                  {campaign.document && (() => {
                    const docUrl = campaign.document;
                    const isPdf = /\.pdf($|\?)/i.test(campaign.document);
                    const isImage = /\.(png|jpe?g|gif|webp|svg)($|\?)/i.test(campaign.document);
                    return (
                      <div className="p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:shadow-sm transition">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{isPdf ? '📄' : isImage ? '🖼️' : '📎'}</span>
                          <div>
                            <p className="text-gray-800 font-medium">Documento público</p>
                            <p className="text-xs text-gray-500">Archivo adjunto</p>
                          </div>
                        </div>
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          Abrir
                        </a>
                      </div>
                    );
                  })()}

                  {campaign.document && (() => {
                    const docUrl = campaign.document;
                    const isPdf = /\.pdf($|\?)/i.test(campaign.document);
                    const isImage = /\.(png|jpe?g|gif|webp|svg)($|\?)/i.test(campaign.document);
                    if (!isPdf && !isImage) return null;
                    return isPdf ? (
                      <iframe
                        src={docUrl}
                        className="w-full h-96 rounded-lg border border-gray-200"
                        title="Vista previa del documento"
                      />
                    ) : (
                      <img
                        src={docUrl}
                        alt="Documento"
                        className="w-full max-h-96 object-contain rounded-lg border border-gray-200 bg-gray-50"
                      />
                    );
                  })()}

                  {campaign.documentLink && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium mb-1">🔒 Documentación interna</p>
                      <p className="text-xs text-gray-500 mb-2">Acceso restringido a administradores</p>
                      <a
                        href={campaign.documentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Acceder a la carpeta de documentos
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2 gap-3 ml-8">
            <h2 className="text-lg font-semibold text-gray-700">
              Acciones de {campaign.name}
              {actions.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredActions.length} de {actions.length})
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={() => { setEditingAction(null); setShowForm(true); }}
              className="inline-flex items-center gap-1.5 text-sm font-medium border border-fuchsia-300 text-fuchsia-700 bg-white px-4 py-2 rounded-lg hover:bg-fuchsia-50 transition-colors whitespace-nowrap"
            >
              Nueva Acción
            </button>
          </div>

          {showForm && (
            <div className="mb-6 ml-8">
              <ActionForm
                initialData={editingAction || {}}
                onSubmit={editingAction ? handleUpdate : handleCreate}
                onCancel={() => { setShowForm(false); setEditingAction(null); }}
                hideCampaignSelect={true}
                fixedCampaignId={id}
                campaigns={[]}
              />
            </div>
          )}

          {/* Filtros: solo si hay al menos una acción */}
          {actions.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 ml-8">
              <div className="flex flex-wrap items-center gap-3">
                {/* Búsqueda */}
                <div className="relative w-56">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-fuchsia-400 text-sm w-full"
                  />
                </div>

                {/* Categoría */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'todas' ? 'Todas las categorías' : categoryLabels[cat] || cat}
                    </option>
                  ))}
                </select>

                {/* Urgencia */}
                <button
                  type="button"
                  onClick={() => setFilterUrgency(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none ${filterUrgency ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  <FaFire className={`w-3.5 h-3.5 ${filterUrgency ? 'text-red-600' : 'text-gray-400'}`} />
                  Urgente
                </button>

                {/* Modalidad */}
                <select
                  value={filterLocationType}
                  onChange={(e) => setFilterLocationType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
                >
                  <option value="all">Modalidad</option>
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                </select>

                {/* Fecha desde */}
                <div className="relative">
                  <button
                    type="button"
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

                {/* Fecha hasta */}
                <div className="relative">
                  <button
                    type="button"
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

                {/* Limpiar todo */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 underline ml-auto"
                  >
                    <FaTimesCircle className="w-3 h-3" /> Limpiar filtros
                  </button>
                )}
              </div>

              {/* Chips de filtros activos */}
              {hasActiveFilters && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                      Búsqueda: {searchTerm}
                      <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filterCategory !== 'todas' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                      {categoryLabels[filterCategory] || filterCategory}
                      <button onClick={() => setFilterCategory('todas')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filterUrgency && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">
                      Urgente
                      <button onClick={() => setFilterUrgency(false)} className="text-red-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filterLocationType !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                      {filterLocationType === 'online' ? 'Online' : 'Presencial'}
                      <button onClick={() => setFilterLocationType('all')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
                    </span>
                  )}
                  {(fromDate || toDate) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                      Fecha: {fromDate ? getLocalDateStr(fromDate) : '...'} → {toDate ? getLocalDateStr(toDate) : '...'}
                      <button onClick={clearDates} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tabla de acciones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ml-8">
            {filteredActions.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                {actions.length === 0 ? 'Aún no hay acciones en esta campaña.' : 'No hay acciones que coincidan con los filtros.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-fuchsia-50 to-fuchsia-100/60 border-b-2 border-fuchsia-200">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Título</th>
                      <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Categoría</th>
                      <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Fecha</th>
                      <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Ubicación</th>
                      <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Urgencia</th>
                      <th scope="col" className="px-4 py-3 text-right text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredActions.map((action) => (
                      <tr key={action.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{action.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span
                            className="px-2 py-1 rounded-full text-xs"
                            style={{
                              backgroundColor: categoryStyles[action.category]?.backgroundColor || '#E5E7EB',
                              color: categoryStyles[action.category]?.color || '#1a1a1a',
                              border: `1px solid ${categoryStyles[action.category]?.borderColor || '#9CA3AF'}`,
                            }}
                          >
                            {categoryLabels[action.category] || action.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(action.datetime).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {action.locationType === 'online' ? '💻 Online' : '📍 Presencial'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {action.urgent ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium"><FaFire className="w-3 h-3" /> Urgente</span> : 'No'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => { setEditingAction(action); setShowForm(true); }}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            aria-label={`Editar acción ${action.title}`}
                          >
                            <FaEdit className="inline" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(action.id)}
                            className="text-red-600 hover:text-red-800"
                            aria-label={`Eliminar acción ${action.title}`}
                          >
                            <FaTrash className="inline" /> Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: vista previa */}
      </div>

      {/* MODAL: Vista previa completa */}
</AdminLayout>
  );
}