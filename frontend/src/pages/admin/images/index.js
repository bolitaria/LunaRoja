import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { downloadCSV } from '../../../utils/exportCsv';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { FaTrash, FaFileExport, FaSearch, FaTh, FaList } from 'react-icons/fa';

function AdminImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = viewMode === 'grid' ? 20 : 10;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchImages = async () => {
    try { const res = await api.get('/images'); setImages(res.data); }
    catch (error) { toast.error('Error al cargar imágenes'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchImages(); }, []);

  const handleDelete = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };
  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete('/images/${id}')));
      toast.success(`${ids.length} imagen(es) eliminada(s)`); setSelected([]); fetchImages();
    } catch (error) { toast.error('Error al eliminar'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  };

  const filtered = images.filter(img => {
    if (searchTerm) { const s = searchTerm.toLowerCase(); if (!(img.relatedTitle || '').toLowerCase().includes(s) && !(img.campaign?.name || '').toLowerCase().includes(s)) return false; }
    if (filterType && img.relatedType !== filterType) return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const total = images.length;
  const actionImages = images.filter(img => img.relatedType === 'action').length;
  const reportImages = total - actionImages;

  const metricCards = [
    { label: 'Total', value: total, filter: '' },
    { label: 'Acciones', value: actionImages, filter: 'action' },
    { label: 'Reportes', value: reportImages, filter: 'report' },
  ];

  const exportCSV = () => {
    const headers = ['type', 'related', 'campaign', 'date', 'url'];
    const data = filtered.map(img => ({ type: img.relatedType === 'action' ? 'Acción' : 'Reporte', related: img.relatedTitle || `ID: ${img.relatedId}`, campaign: img.campaign ? img.campaign.name : '', date: new Date(img.createdAt).toLocaleDateString(), url: `${process.env.NEXT_PUBLIC_BASE_URL}${img.url}` }));
    downloadCSV(data, headers, 'imagenes.csv');
  };

  const toggleSelectAll = (e) => { if (e.target.checked) setSelected(paginated.map(img => img.id)); else setSelected([]); };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Imágenes">
      <ToastContainer />
      <ConfirmModal isOpen={showDeleteModal} title="Eliminar imagen" message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} imágenes seleccionadas?` : '¿Eliminar esta imagen?')} onConfirm={executeDelete} onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }} />

      <div className="bg-gray-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-gray-100">
        {metricCards.map((m, i) => (
          <button key={i} onClick={() => { setFilterType(m.filter); setCurrentPage(1); }} className={`flex items-center gap-1.5 transition-colors group ${filterType === m.filter ? 'text-fuchsia-700' : 'hover:text-fuchsia-700'}`}>
            <span className={`text-xs ${filterType === m.filter ? 'text-fuchsia-600' : 'text-gray-500 group-hover:text-fuchsia-600'}`}>{m.label}</span>
            <span className={`font-bold ${filterType === m.filter ? 'text-fuchsia-800' : 'text-gray-800 group-hover:text-fuchsia-700'}`}>{m.value}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 ${viewMode === 'grid' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-white text-gray-500'}`}><FaTh className="mr-1 inline" /> Galería</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 ${viewMode === 'list' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-white text-gray-500'}`}><FaList className="mr-1 inline" /> Lista</button>
          </div>
          {selected.length > 0 && (<button onClick={handleDeleteSelected} className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"><FaTrash /> Eliminar ({selected.length})</button>)}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48" /></div>
          <button onClick={exportCSV} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"><FaFileExport className="w-3.5 h-3.5" /> Exportar</button>
        </div>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Cargando...</p> : filtered.length === 0 ? <p className="text-gray-500 text-sm">No se encontraron imágenes.</p> : viewMode === 'grid' ? (
        <div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginated.map(img => (
            <div key={img.id} className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <input type="checkbox" className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity" checked={selected.includes(img.id)} onChange={() => toggleOne(img.id)} />
              <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`} alt="" className="w-full h-40 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="p-2"><p className="text-xs text-gray-500 truncate">{img.relatedTitle || `ID: ${img.relatedId}`}</p>{img.campaign && (<div className="flex items-center gap-1 mt-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: img.campaign.color }} /><span className="text-xs text-gray-400 truncate">{img.campaign.name}</span></div>)}</div>
              <button onClick={() => handleDelete(img.id)} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash className="text-red-500 w-4 h-4" /></button>
            </div>
          ))}
        </div><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr><th className="px-6 py-3 text-left w-10"><input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} /></th><th className="px-6 py-3 text-left">Vista previa</th><th className="px-6 py-3 text-left hidden sm:table-cell">Tipo</th><th className="px-6 py-3 text-left hidden md:table-cell">Relacionado</th><th className="px-6 py-3 text-left hidden md:table-cell">Campaña</th><th className="px-6 py-3 text-left">Fecha</th><th className="px-6 py-3 text-left">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(img => (
                <tr key={img.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><input type="checkbox" checked={selected.includes(img.id)} onChange={() => toggleOne(img.id)} /></td>
                  <td className="px-6 py-4"><img src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`} alt="" className="h-10 w-10 object-cover rounded" /></td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{img.relatedType === 'action' ? 'Acción' : 'Reporte'}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{img.relatedTitle || `ID: ${img.relatedId}`}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{img.campaign ? (<div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: img.campaign.color }} /><span className="text-gray-700">{img.campaign.name}</span></div>) : '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(img.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><button onClick={() => handleDelete(img.id)} className="text-gray-400 hover:text-red-600"><FaTrash /></button></td>
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

export default AdminImages;