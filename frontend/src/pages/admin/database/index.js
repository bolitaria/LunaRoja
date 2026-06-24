import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaDatabase, FaTable, FaDownload, FaSync, FaSearch, FaEye, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';

function AdminDatabase() {
  const { user } = useAuth();
  const [dbInfo, setDbInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [tableIndexes, setTableIndexes] = useState([]);
  const [executingMigrations, setExecutingMigrations] = useState(false);
  const itemsPerPage = 10;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchDatabaseInfo = async () => {
    try {
      const res = await api.get('/database/info');
      setDbInfo(res.data);
    } catch (error) {
      toast.error('Error al cargar información de la base de datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'superadmin') {
      fetchDatabaseInfo();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchTableIndexes = async (tableName) => {
    try {
      const res = await api.get('/database/tables/${tableName}/indexes');
      setTableIndexes(res.data);
      setSelectedTable(tableName);
      setShowIndexModal(true);
    } catch (error) {
      toast.error('Error al cargar índices');
    }
  };

  const handleRunMigrations = async () => {
    if (!confirm('¿Ejecutar migraciones pendientes? Puede afectar la estructura de la base de datos.')) return;
    setExecutingMigrations(true);
    try {
      await api.post('/database/migrations', {});
      toast.success('Migraciones ejecutadas correctamente');
      fetchDatabaseInfo();
    } catch (error) {
      toast.error('Error al ejecutar migraciones');
    } finally {
      setExecutingMigrations(false);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/database/backup`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${new Date().toISOString().slice(0, 10)}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Backup descargado');
    } catch (error) {
      toast.error('Error al generar backup');
    }
  };

  // Si está cargando
  if (loading) {
    return <AdminLayout title="Base de Datos"><div className="text-center py-8">Cargando información...</div></AdminLayout>;
  }

  // Si no es superadmin
  if (!user || user.role !== 'superadmin') {
    return (
      <AdminLayout title="Base de Datos">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-700">No tienes permisos para ver este panel. Solo los superadministradores pueden acceder.</p>
        </div>
      </AdminLayout>
    );
  }

  // Si no hay datos
  if (!dbInfo) {
    return (
      <AdminLayout title="Base de Datos">
        <div className="text-center py-8 text-red-600">No se pudo cargar la información.</div>
      </AdminLayout>
    );
  }

  const tables = dbInfo.tables || [];
  const totalTables = tables.length;
  const totalSize = dbInfo.totalSize || '0 MB';
  const databaseName = dbInfo.databaseName || 'lunaroja';

  // Métricas
  const metricCards = [
    { label: 'Tablas', value: totalTables },
    { label: 'Tamaño total', value: totalSize },
    { label: 'Base de datos', value: databaseName },
  ];

  const filteredTables = tables.filter(t =>
    t.tablename.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredTables.length / itemsPerPage);
  const paginated = filteredTables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AdminLayout title="Base de Datos">
      <ToastContainer />

      {/* Métricas */}
      <div className="bg-gray-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-gray-100">
        {metricCards.map((m, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">{m.label}</span>
            <span className="font-bold text-gray-800">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackup}
            className="inline-flex items-center gap-1.5 text-sm border border-green-300 text-green-700 bg-white px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
          >
            <FaDownload className="w-3.5 h-3.5" /> Backup
          </button>
          <button
            onClick={handleRunMigrations}
            disabled={executingMigrations}
            className="inline-flex items-center gap-1.5 text-sm border border-amber-300 text-amber-700 bg-white px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            <FaSync className={`w-3.5 h-3.5 ${executingMigrations ? 'animate-spin' : ''}`} />
            {executingMigrations ? 'Ejecutando...' : 'Migraciones'}
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar tabla..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48"
            />
          </div>
        </div>
      </div>

      {/* Listado de tablas */}
      {filteredTables.length === 0 ? (
        <p className="text-gray-500 text-sm">No se encontraron tablas.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Tabla</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Filas</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Tamaño</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(table => (
                <tr key={table.tablename} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{table.tablename}</td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">
                    {table.rows !== null ? table.rows.toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{table.size || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => fetchTableIndexes(table.tablename)}
                      className="text-gray-400 hover:text-fuchsia-600 transition-colors"
                      title="Ver índices"
                    >
                      <FaEye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* Modal de índices */}
      {showIndexModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowIndexModal(false)}>
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-700">Índices de {selectedTable}</h3>
              <button onClick={() => setShowIndexModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            {tableIndexes.length === 0 ? (
              <p className="text-gray-500">No hay índices definidos para esta tabla.</p>
            ) : (
              <ul className="space-y-2">
                {tableIndexes.map((idx, i) => (
                  <li key={i} className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="font-medium text-gray-700">{idx.indexname}</p>
                    <p className="text-xs text-gray-500 break-all">{idx.indexdef}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDatabase;