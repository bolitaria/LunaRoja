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

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', file: null });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 10;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchReports = async () => {
    try { const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`, { headers: { Authorization: `Bearer ${token}` } }); setReports(res.data); }
    catch (error) { toast.error('Error al cargar reportes'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchReports(); }, []);

  const handleChange = (e) => { if (e.target.name === 'file') setForm({ ...form, file: e.target.files[0] }); else setForm({ ...form, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(); formData.append('title', form.title); formData.append('description', form.description); if (form.file) formData.append('file', form.file);
    try {
      if (editingId) { await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/reports/${editingId}`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }); toast.success('Reporte actualizado'); }
      else { await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reports`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }); toast.success('Reporte creado'); }
      setForm({ title: '', description: '', file: null }); setEditingId(null); setShowForm(false); fetchReports();
    } catch (error) { toast.error('Error al guardar'); }
  };

  const handleEdit = (report) => { setForm({ title: report.title, description: report.description || '', file: null }); setEditingId(report.id); setShowForm(true); };

  const handleDelete = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };
  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}`, { headers: { Authorization: `Bearer ${token}` } })));
      toast.success(`${ids.length} reporte(s) eliminado(s)`); setSelected([]); fetchReports();
    } catch (error) { toast.error('Error al eliminar'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  };

  const filtered = reports.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCSV = () => {
    const headers = ['title', 'date', 'fileUrl'];
    const data = filtered.map(r => ({ title: r.title, date: new Date(r.publishedAt).toLocaleDateString(), fileUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${r.fileUrl}` }));
    downloadCSV(data, headers, 'reportes.csv');
  };

  const toggleSelectAll = (e) => { if (e.target.checked) setSelected(paginated.map(r => r.id)); else setSelected([]); };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Reportes">
      <ToastContainer />
      <ConfirmModal isOpen={showDeleteModal} title="Eliminar reporte" message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} reportes seleccionados?` : '¿Eliminar este reporte?')} onConfirm={executeDelete} onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }} />

      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Total', value: reports.length, color: 'bg-yellow-100 text-yellow-800' },
          { label: 'Última subida', value: reports.length ? new Date(reports[0].publishedAt).toLocaleDateString() : '-', color: 'bg-gray-100 text-gray-800' },
        ].map((m, i) => (
          <div key={i} className={`rounded-xl p-4 ${m.color} flex flex-col`}>
            <span className="text-sm font-medium">{m.label}</span>
            <span className="text-2xl font-bold">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', description: '', file: null }); }}
            className="inline-flex items-center gap-1.5 text-sm border border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors">
            <FaPlus className="w-3.5 h-3.5" /> Nuevo reporte
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
          <button onClick={exportCSV} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            <FaFileExport className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 space-y-4" encType="multipart/form-data">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Título *</label><input type="text" name="title" value={form.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label><textarea name="description" value={form.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Archivo PDF *</label><input type="file" name="file" accept=".pdf" onChange={handleChange} required={!editingId} className="w-full" />{editingId && <p className="text-sm text-gray-500 mt-1">Dejar vacío para mantener el actual</p>}</div>
          <button type="submit" className="inline-flex items-center gap-1 text-sm bg-fuchsia-600 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-700 transition-colors">{editingId ? 'Actualizar' : 'Crear'}</button>
        </form>
      )}

      {loading ? <p className="text-gray-500 text-sm">Cargando...</p> : filtered.length === 0 ? <p className="text-gray-500 text-sm">No se encontraron reportes.</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left w-10"><input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} /></th>
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Fecha</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Archivo</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(report => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><input type="checkbox" checked={selected.includes(report.id)} onChange={() => toggleOne(report.id)} /></td>
                  <td className="px-6 py-4 font-medium text-gray-900">{report.title}</td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{new Date(report.publishedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 hidden sm:table-cell"><a href={`${process.env.NEXT_PUBLIC_BASE_URL}${report.fileUrl}`} target="_blank" rel="noopener" className="text-blue-600 hover:underline">Ver PDF</a></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2"><button onClick={() => handleEdit(report)} className="text-gray-400 hover:text-fuchsia-600 transition-colors"><FaEdit /></button><button onClick={() => handleDelete(report.id)} className="text-gray-400 hover:text-red-600 transition-colors"><FaTrash /></button></div></td>
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

export default withAuth(AdminReports);