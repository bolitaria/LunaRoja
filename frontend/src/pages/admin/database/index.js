import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import AdminLayout from '../../../components/AdminLayout';
import { FaSearch, FaTimes, FaDatabase, FaFileExport, FaPlay } from 'react-icons/fa';

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
    if (!confirm('¿Estás seguro de ejecutar las migraciones? Esta acción puede modificar la estructura de la base de datos.')) return;
    setLoadingAction(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/admin/database/migrate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setActionFeedback({ type: 'success', message: data.message || 'Migraciones ejecutadas correctamente.' });
    } catch (err) {
      setActionFeedback({ type: 'error', message: 'Error al ejecutar migraciones.' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBackup = async () => {
    if (!confirm('Se descargará una copia de seguridad completa. ¿Continuar?')) return;
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

  // Datos de ejemplo (reemplazar con datos reales de tu API)
  const sampleData = queryResult || [
    { tabla: 'users', registros: 120, estado: 'Activo' },
    { tabla: 'actions', registros: 45, estado: 'Activo' },
    { tabla: 'campaigns', registros: 12, estado: 'Activo' },
  ];

  return (
    <AdminLayout title="Base de Datos">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Base de Datos</h2>

        {/* Filtros y búsqueda */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tabla, registro o campo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
          <div className="bg-white border border-purple-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-purple-50 border-b border-purple-100 px-5 py-3 flex items-center gap-2">
              <span className="text-purple-700 font-semibold text-sm">🔧 Herramientas avanzadas (solo Superadmin)</span>
              <span className="text-xs text-purple-600 ml-auto">Estas acciones modifican la estructura o los datos del sistema.</span>
            </div>
            <div className="p-5 space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleRunMigration}
                  disabled={loadingAction}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
                >
                  <FaDatabase className="w-4 h-4" />
                  Ejecutar migraciones
                </button>
                <p className="text-sm text-gray-600 flex-1">
                  Aplica los cambios de esquema pendientes. <strong className="text-purple-700">Usar solo cuando se indique tras una actualización.</strong>
                </p>
                <button
                  onClick={handleBackup}
                  disabled={loadingAction}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
                >
                  <FaFileExport className="w-4 h-4" />
                  Copia de seguridad
                </button>
                <p className="text-sm text-gray-600 flex-1">
                  Descarga una copia completa de la base de datos. <strong className="text-gray-800">Recomendado antes de operaciones críticas.</strong>
                </p>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Consultas predefinidas</label>
                <div className="flex flex-wrap items-start gap-3">
                  <select
                    value={selectedQuery}
                    onChange={(e) => setSelectedQuery(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm min-w-[250px]"
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
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition ${
                      selectedQuery && !loadingAction
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FaPlay className="w-3 h-3" />
                    Ejecutar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Estas consultas son seguras y no modifican datos críticos. El resultado se mostrará en la tabla inferior.
                </p>
              </div>

              {actionFeedback && (
                <div className={`p-3 rounded-lg text-sm font-medium ${
                  actionFeedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {actionFeedback.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabla de datos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Datos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tabla</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registros</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{row.tabla}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.registros}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.estado}</td>
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