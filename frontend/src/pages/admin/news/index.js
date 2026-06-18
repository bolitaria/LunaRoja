import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { downloadCSV } from '../../../utils/exportCsv';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { FaEdit, FaTrash, FaFileExport, FaSearch, FaPlus } from 'react-icons/fa';

function AdminNews() {
  const [news, setNews] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', youtubeUrl: '', thumbnail: '', isNews: false, campaignId: '', actionId: '' });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 10;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const getYoutubeId = (url) => { if (!url) return null; const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/); return (m && m[2].length === 11) ? m[2] : null; };

  const fetchNews = async () => {
    try { const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/news`, { headers: { Authorization: `Bearer ${token}` } }); setNews(res.data); }
    catch (error) { toast.error('Error al cargar noticias'); }
  };
  const fetchCampaigns = async () => {
    try { const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, { headers: { Authorization: `Bearer ${token}` } }); setCampaigns(res.data); }
    catch (error) { toast.error('Error al cargar campañas'); }
  };
  const fetchActions = async () => {
    try { const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, { headers: { Authorization: `Bearer ${token}` } }); setActions(res.data); }
    catch (error) { toast.error('Error al cargar acciones'); }
  };

  useEffect(() => { Promise.all([fetchNews(), fetchCampaigns(), fetchActions()]).then(() => setLoading(false)); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setForm(prev => {
      const updated = { ...prev, [name]: newValue };
      if (name === 'youtubeUrl') { const id = getYoutubeId(value); updated.thumbnail = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''; }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        title: form.title,
        description: form.description,
        youtubeUrl: form.youtubeUrl,
        thumbnail: form.thumbnail,
        isNews: form.isNews,
        campaignId: form.campaignId === '' ? null : Number(form.campaignId),
        actionId: form.actionId === '' ? null : Number(form.actionId),
      };
      if (editingId) { await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/news/${editingId}`, data, { headers: { Authorization: `Bearer ${token}` } }); toast.success('Noticia actualizada'); }
      else { await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/news`, data, { headers: { Authorization: `Bearer ${token}` } }); toast.success('Noticia creada'); }
      setForm({ title: '', description: '', youtubeUrl: '', thumbnail: '', isNews: false, campaignId: '', actionId: '' }); setEditingId(null); setShowForm(false); fetchNews();
    } catch (error) { toast.error('Error al guardar'); }
  };

  const handleEdit = (item) => {
    setForm({ title: item.title, description: item.description || '', youtubeUrl: item.youtubeUrl, thumbnail: item.thumbnail || '', isNews: item.isNews || false, campaignId: item.campaignId || '', actionId: item.actionId || '' });
    setEditingId(item.id); setShowForm(true);
  };

  const handleDelete = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };
  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/news/${id}`, { headers: { Authorization: `Bearer ${token}` } })));
      toast.success(`${ids.length} noticia(s) eliminada(s)`); setSelected([]); fetchNews();
    } catch (error) { toast.error('Error al eliminar'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  };

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  const actionMap = actions.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});

  const filtered = news.filter(item => {
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCampaignId && item.campaignId !== filterCampaignId) return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const total = news.length;
  const isNewsCount = news.filter(n => n.isNews).length;

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
      <ConfirmModal isOpen={showDeleteModal} title="Eliminar noticia" message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} noticias seleccionadas?` : '¿Eliminar esta noticia?')} onConfirm={executeDelete} onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }} />

      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Total', value: total, color: 'bg-red-100 text-red-800' },
          { label: 'Noticias destacadas', value: isNewsCount, color: 'bg-yellow-100 text-yellow-800' },
        ].map((m, i) => (
          <div key={i} className={`rounded-xl p-4 ${m.color} flex flex-col`}>
            <span className="text-sm font-medium">{m.label}</span>
            <span className="text-2xl font-bold">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', description: '', youtubeUrl: '', thumbnail: '', isNews: false, campaignId: '', actionId: '' }); }}
            className="inline-flex items-center gap-1.5 text-sm border border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors">
            <FaPlus className="w-3.5 h-3.5" /> Nueva noticia
          </button>
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

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Título *</label><input type="text" name="title" value={form.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label><textarea name="description" value={form.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">URL de YouTube *</label><input type="url" name="youtubeUrl" value={form.youtubeUrl} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />{form.thumbnail && <img src={form.thumbnail} alt="Vista previa" className="mt-2 h-20 rounded shadow" />}</div>
          <div className="flex items-center"><input type="checkbox" name="isNews" checked={form.isNews} onChange={handleChange} className="mr-2" /><label className="text-sm text-gray-700">Es noticia</label></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Campaña</label><select name="campaignId" value={form.campaignId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"><option value="">-- Ninguna --</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Acción</label><select name="actionId" value={form.actionId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"><option value="">-- Ninguna --</option>{actions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></div>
          </div>
          <button type="submit" className="inline-flex items-center gap-1 text-sm bg-fuchsia-600 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-700 transition-colors">{editingId ? 'Actualizar' : 'Crear'}</button>
        </form>
      )}

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
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleOne(item.id)} /></td>
                  <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{item.isNews ? 'Sí' : 'No'}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{item.campaign ? (<div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.campaign.color }} /><span className="text-gray-700">{item.campaign.name}</span></div>) : '-'}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{item.action ? item.action.title : '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(item.publishedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2"><button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-fuchsia-600 transition-colors"><FaEdit /></button><button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 transition-colors"><FaTrash /></button></div></td>
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

export default withAuth(AdminNews);