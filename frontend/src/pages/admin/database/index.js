import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import AdminLayout from '../../../components/AdminLayout';
import {
  FaSearch, FaTimes, FaDatabase, FaFileExport, FaPlay,
  FaShieldAlt, FaDownload, FaWrench
} from 'react-icons/fa';

export default function DatabasePage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ table: '', status: '' });
  const [selectedQuery, setSelectedQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';

  const handleRunMigration = async () => {
    if (!confirm('¿Ejecutar migraciones? Esto puede modificar la estructura de la BD.')) return;
    setLoadingAction(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/admin/database/migrate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setActionFeedback({ type: 'success', message: data.message || 'Migraciones ejecutadas.' });
    } catch (err) {
      setActionFeedback({ type: 'error', message: 'Error al ejecutar migraciones.' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBackup = async () => {
    if (!confirm('¿Descargar copia de seguridad completa?')) return;
    setLoadingAction(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/admin/database/backup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().slice(0,10)}.sql`;
        a.click();
        setActionFeedback({ type: 'success', message: 'Copia de seguridad descargada.' });
      } else {
        throw new Error('Error en el servidor');
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: 'Error al generar la copia de seguridad.' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRunQuery = async () => {
    if (!selectedQuery) return;
    if (!confirm(`¿Ejecutar la consulta "${selectedQuery}"?`)) return;
    setLoadingAction(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ queryName: selectedQuery })
      });
      const data = await res.json();
      setQueryResult(data.result);
      setActionFeedback({ type: 'success', message: 'Consulta ejecutada correctamente.' });
    } catch (err) {
      setActionFeedback({ type: 'error', message: 'Error al ejecutar la consulta.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Datos de ejemplo (puedes reemplazar con datos reales de tu API)
  const sampleData = queryResult || [
    { tabla: 'users', registros: 120, estado: 'Activo' },
    { tabla: 'actions', registros: 45, estado: 'Activo' },
    { tabla: 'campaigns', registros: 12, estado: 'Activo' },
  ];

  return (
    <AdminLayout title="Base de Datos">
      <div className="space-y-6">
        {/* Métricas y filtros */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tabla, registro o campo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <select
              value={filters.table}
              onChange={(e) => setFilters({ ...filters, table: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
            >
              <option value="">Todas las tablas</option>
              <option value="users">Usuarios</option>
              <option value="actions">Acciones</option>
              <option value="campaigns">Campañas</option>
              <option value="news">Noticias</option>
              <option value="subscribers">Suscriptores</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
            >
              <option value="">Cualquier estado</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Panel de superadmin */}
        {isSuperAdmin && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-5">
              <h3 className="text-md font-semibold text-fuchsia-800 flex items-center gap-2 mb-4">
                <FaShieldAlt className="w-4 h-4" /> Herramientas avanzadas (solo Superadmin)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaWrench className="text-fuchsia-600 w-4 h-4" />
                    <span className="font-medium text-gray-700">Migraciones</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    Aplica cambios de esquema pendientes. <strong className="text-fuchsia-700">Usar solo tras una actualización.</strong>
                  </p>
                  <button
                    onClick={handleRunMigration}
                    disabled={loadingAction}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-lg font-medium hover:bg-fuchsia-700 transition disabled:opacity-50 text-sm"
                  >
                    <FaDatabase className="w-3 h-3" /> Ejecutar migraciones
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaDownload className="text-gray-700 w-4 h-4" />
                    <span className="font-medium text-gray-700">Copia de seguridad</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    Descarga una copia completa de la base de datos. <strong>Recomendado antes de operaciones críticas.</strong>
                  </p>
                  <button
                    onClick={handleBackup}
                    disabled={loadingAction}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 text-sm"
                  >
                    <FaFileExport className="w-3 h-3" /> Generar backup
                  </button>
                </div>
              </div>
            </div>

            {/* Consultas predefinidas */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-5">
              <h3 className="text-md font-semibold text-fuchsia-800 flex items-center gap-2 mb-4">
                <FaDatabase className="w-4 h-4" /> Consultas predefinidas
              </h3>
              <div className="flex flex-wrap items-start gap-3">
                <select
                  value={selectedQuery}
                  onChange={(e) => setSelectedQuery(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm min-w-[260px]"
                >
                  <option value="">Selecciona una consulta</option>
                  <option value="optimize">Optimizar tablas (ANALYZE/OPTIMIZE)</option>
                  <option value="clean-logs">Limpiar logs antiguos (&gt;90 días)</option>
                  <option value="user-stats">Estadísticas de usuarios por rol</option>
                  <option value="action-count">Acciones por campaña</option>
                </select>
                <button
                  onClick={handleRunQuery}
                  disabled={!selectedQuery || loadingAction}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition text-sm ${
                    selectedQuery && !loadingAction
                      ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <FaPlay className="w-3 h-3" />
                  Ejecutar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Consultas seguras que no modifican datos críticos. El resultado se mostrará en la tabla inferior.
              </p>
            </div>

            {actionFeedback && (
              <div className={`p-3 rounded-lg text-sm font-medium ${
                actionFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {actionFeedback.message}
              </div>
            )}
          </div>
        )}

        {/* Tabla de datos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Datos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-purple-100 text-sm">
              <thead className="bg-fuchsia-50 text-fuchsia-800 uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-3 text-left">Tabla</th>
                  <th className="px-6 py-3 text-left">Registros</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {sampleData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row.tabla}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{row.registros}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{row.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}