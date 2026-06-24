import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { downloadCSV } from '../../../utils/exportCsv';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { FaEye, FaTrash, FaFileExport, FaSearch, FaLock, FaGlobe } from 'react-icons/fa';

function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [filterActionId, setFilterActionId] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 10;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (error) {
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };
  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data);
    } catch (error) {
      toast.error('Error al cargar campañas');
    }
  };
  const fetchActions = async () => {
    try {
      const res = await api.get('/actions');
      setActions(res.data);
    } catch (error) {
      toast.error('Error al cargar acciones');
    }
  };

  useEffect(() => {
    Promise.all([fetchDocuments(), fetchCampaigns(), fetchActions()]).then(() => setLoading(false));
  }, []);

  const handleDelete = (id) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };
  const handleDeleteSelected = () => {
    if (selected.length === 0) return;
    setDeleteTarget(selected);
    setShowDeleteModal(true);
  };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id =>
        api.delete('/documents/${id}')
      ));
      toast.success(`${ids.length} documento(s) eliminado(s)`);
      setSelected([]);
      fetchDocuments();
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  const actionMap = actions.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});

  const filtered = documents.filter(doc => {
    if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCampaignId && doc.campaignId !== parseInt(filterCampaignId)) return false;
    if (filterActionId && doc.actionId !== parseInt(filterActionId)) return false;
    if (filterVisibility && doc.type !== filterVisibility) return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const total = documents.length;
  const publicCount = documents.filter(d => d.type === 'public').length;
  const privateCount = total - publicCount;

  // Métricas clickeables
  const metricCards = [
    { label: 'Total', value: total, filter: '' },
    { label: 'Públicos', value: publicCount, filter: 'public' },
    { label: 'Privados', value: privateCount, filter: 'organizer' },
  ];

  const exportCSV = () => {
    const headers = ['title', 'visibility', 'campaign', 'action', 'date', 'url'];
    const data = filtered.map(doc => ({
      title: doc.title,
      visibility: doc.type === 'public' ? 'Público' : 'Privado',
      campaign: doc.campaignId ? campaignMap[doc.campaignId]?.name || '' : '',
      action: doc.actionId ? actionMap[doc.actionId]?.title || '' : '',
      date: new Date(doc.createdAt).toLocaleDateString(),
      url: doc.fileUrl ? `${process.env.NEXT_PUBLIC_BASE_URL}${doc.fileUrl}` : ''
    }));
    downloadCSV(data, headers, 'documentos.csv');
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(paginated.map(d => d.id));
    else setSelected([]);
  };
  const toggleOne = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Documentos">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar documento"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} documentos seleccionados?` : '¿Eliminar este documento?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      {/* Métricas clickeables (barra homogénea) */}
      <div className="bg-gray-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-gray-100">
        {metricCards.map((m, i) => (
          <button
            key={i}
            onClick={() => { setFilterVisibility(m.filter); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 transition-colors group ${filterVisibility === m.filter ? 'text-fuchsia-700' : 'hover:text-fuchsia-700'}`}
          >
            <span className={`text-xs ${filterVisibility === m.filter ? 'text-fuchsia-600' : 'text-gray-500 group-hover:text-fuchsia-600'}`}>
              {m.label}
            </span>
            <span className={`font-bold ${filterVisibility === m.filter ? 'text-fuchsia-800' : 'text-gray-800 group-hover:text-fuchsia-700'}`}>
              {m.value}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaTrash /> Eliminar ({selected.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48"
            />
          </div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaFileExport className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterCampaignId}
          onChange={(e) => { setFilterCampaignId(e.target.value); setCurrentPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-gray-50 text-gray-600"
        >
          <option value="">Campaña</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filterActionId}
          onChange={(e) => { setFilterActionId(e.target.value); setCurrentPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-gray-50 text-gray-600"
        >
          <option value="">Acción</option>
          {actions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
        {/* Ya no necesitamos el select de visibilidad porque las métricas clickeables lo reemplazan */}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No se encontraron documentos.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={paginated.length > 0 && selected.length === paginated.length}
                  />
                </th>
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Visibilidad</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Campaña</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Acción</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(doc => {
                const campaign = campaignMap[doc.campaignId];
                const action = actionMap[doc.actionId];
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(doc.id)}
                        onChange={() => toggleOne(doc.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{doc.title}</td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${doc.type === 'public' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {doc.type === 'public' ? <><FaGlobe className="w-3 h-3" /> Público</> : <><FaLock className="w-3 h-3" /> Privado</>}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {campaign ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: campaign.color }} />
                          <span className="text-gray-700">{campaign.name}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                      {action ? action.title : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`${process.env.NEXT_PUBLIC_BASE_URL}${doc.fileUrl}`}
                          target="_blank"
                          rel="noopener"
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <FaEye />
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDocuments;