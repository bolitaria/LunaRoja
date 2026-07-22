import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { FaEye, FaEyeSlash, FaTrash, FaSearch, FaEdit } from 'react-icons/fa';

export default function AdminPetitions() {
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 10;

  const fetchPetitions = async () => {
    try {
      const res = await api.get('/petitions');
      setPetitions(res.data);
    } catch (error) {
      toast.error('Error al cargar peticiones');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPetitions(); }, []);

  const toggleHidden = async (id, currentHidden) => {
    try {
      await api.put(`/petitions/${id}`, { hidden: !currentHidden });
      toast.success(`Petición ${currentHidden ? 'visible' : 'oculta'} correctamente`);
      fetchPetitions();
    } catch (err) {
      toast.error('No se pudo cambiar la visibilidad');
    }
  };

  const handleDeleteSelected = () => {
    if (selected.length === 0) return;
    setDeleteTarget(selected);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/petitions/${id}`)));
      toast.success(`${ids.length} petición(es) eliminada(s)`);
      setSelected([]);
      fetchPetitions();
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const filtered = petitions.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(paginated.map(p => p.id));
    else setSelected([]);
  };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Firma Peticiones">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar petición"
        message={Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} peticiones?` : '¿Eliminar esta petición?'}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/petitions/new" className="inline-flex items-center gap-1.5 text-sm font-medium border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-4 py-2 rounded-lg hover:bg-fuchsia-50 shadow-sm">
            Nueva Petición
          </Link>
          {selected.length > 0 && (
            <button onClick={handleDeleteSelected} className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">
              <FaTrash /> Eliminar ({selected.length})
            </button>
          )}
        </div>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar…"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron peticiones</p>
          <p className="text-sm">Crea una nueva petición para empezar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-purple-100 text-sm">
            <thead className="bg-fuchsia-50 text-fuchsia-800 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Acciones</th>
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Tipo</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Urgencia</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Firmas</th>
                <th className="px-6 py-3 text-left">Visible</th>
                <th className="px-6 py-3 text-right w-10">
                  <input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {paginated.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <a href={`/peticiones/${p.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Ver página pública">
                        <FaEye className="w-5 h-5" />
                      </a>
                      {p.total_signatures === 0 && (
                        <Link href={`/admin/petitions/${p.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <FaEdit className="w-5 h-5" />
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{p.title}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{p.type === 'official' ? 'Oficial' : 'Personalizada'}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{p.urgency ? '🔥 Sí' : '—'}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{p.total_signatures}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleHidden(p.id, p.hidden)}
                      className={`p-1.5 rounded-lg ${p.hidden ? 'text-gray-400 hover:text-yellow-600' : 'text-green-600 hover:text-green-800'}`}
                      title={p.hidden ? 'Mostrar al público' : 'Ocultar al público'}
                    >
                      {p.hidden ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleOne(p.id)} />
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