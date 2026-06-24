import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { downloadCSV } from '../../../utils/exportCsv';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { FaEdit, FaTrash, FaFileExport, FaSearch } from 'react-icons/fa';

function AdminNews() {
  const [news, setNews] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [filterIsNews, setFilterIsNews] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 10;

  const fetchNews = async () => {
    try { const res = await api.get('/news'); setNews(res.data); }
    catch (error) { toast.error('Error al cargar noticias'); }
  };
  const fetchCampaigns = async () => {
    try { const res = await api.get('/campaigns'); setCampaigns(res.data); }
    catch (error) { toast.error('Error al cargar campañas'); }
  };
  const fetchActions = async () => {
    try { const res = await api.get('/actions'); setActions(res.data); }
    catch (error) { toast.error('Error al cargar acciones'); }
  };

  useEffect(() => {
    Promise.all([fetchNews(), fetchCampaigns(), fetchActions()]).then(() => setLoading(false));
  }, []);

  const handleDelete = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };
  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/news/${id}`)));
      toast.success(`${ids.length} noticia(s) eliminada(s)`);
      setSelected([]);
      fetchNews();
    } catch (error) { toast.error('Error al eliminar'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  };

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  const actionMap = actions.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});

  const filtered = news.filter(item => {
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCampaignId && item.campaignId !== filterCampaignId) return false;
    if (filterIsNews !== '' && item.isNews !== (filterIsNews === 'true')) return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const total = news.length;
  const isNewsCount = news.filter(n => n.isNews).length;
  const normalCount = total - isNewsCount;

  const metricCards = [
    { label: 'Total', value: total, filter: '' },
    { label: 'Destacadas', value: isNewsCount, filter: 'true' },
    { label: 'Normales', value: normalCount, filter: 'false' },
  ];

  const exportCSV = () => {
    const headers = ['title', 'isNews', 'campaign', 'action', 'date'];
    const data = filtered.map(item => ({
      title: item.title,
      isNews: item.isNews ? 'Sí' : 'No',
      campaign: item.campaign ? item.campaign.name : '',
      action: item.action ? item.action.title : '',
      date: new Date(item.publishedAt).toLocaleDateString()
    }));
    downloadCSV(data, headers, 'noticias.csv');
  };

  const toggleSelectAll = (e) => { if (e.target.checked) setSelected(paginated.map(n => n.id)); else setSelected([]); };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Noticias">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar noticia"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} noticias seleccionadas?` : '¿Eliminar esta noticia?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      <div className="bg-gray-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-gray-100">
        {metricCards.map((m, i) => (
          <button key={i} onClick={() => { setFilterIsNews(m.filter); setCurrentPage(1); }} className={`flex items-center gap-1.5 transition-colors group ${filterIsNews === m.filter ? 'text-fuchsia-700' : 'hover:text-fuchsia-700'}`}>
            <span className={`text-xs ${filterIsNews === m.filter ? 'text-fuchsia-600' : 'text-gray-500 group-hover:text-fuchsia-600'}`}>{m.label}</span>
            <span className={`font-bold ${filterIsNews === m.filter ? 'text-fuchsia-800' : 'text-gray-800 group-hover:text-fuchsia-700'}`}>{m.value}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <a href="/admin/news/new" className="inline-flex items-center gap-1.5 text-sm border border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors">
            Nueva noticia
          </a>
          {selected.length > 0 && (
            <button onClick={handleDeleteSelected} className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
              <FaTrash /> Eliminar ({selected.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48" />
          </div>
          <select value={filterCampaignId} onChange={(e) => { setFilterCampaignId(e.target.value); setCurrentPage(1); }} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-gray-50 text-gray-600">
            <option value="">Campaña</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={exportCSV} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            <FaFileExport className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Cargando...</p> : filtered.length === 0 ? <p className="text-gray-500 text-sm">No se encontraron noticias.</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left w-10"><input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} /></th>
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Noticia</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Campaña</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Acción</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleOne(item.id)} /></td>
                  <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{item.isNews ? 'Sí' : 'No'}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{item.campaign ? <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.campaign.color }} /><span className="text-gray-700">{item.campaign.name}</span></div> : '-'}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{item.action ? item.action.title : '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(item.publishedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <a href={`/admin/news/${item.id}`} className="text-gray-400 hover:text-fuchsia-600 transition-colors"><FaEdit /></a>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 transition-colors"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminNews;