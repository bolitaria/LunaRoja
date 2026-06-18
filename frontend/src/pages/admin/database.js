import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminDatabase() {
  const [loading, setLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState({ tables: [], totalSize: '', databaseName: '' });
  const [selectedTable, setSelectedTable] = useState('Campaigns');  
  const [duplicates, setDuplicates] = useState({ duplicates: [], count: 0, total: 0 });
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetchDatabaseInfo();
    fetchDuplicates(selectedTable);
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/db-admin/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDbInfo(res.data);
    } catch (error) {
      toast.error('❌ Error al cargar información de la base de datos');
    }
  };

  const fetchDuplicates = async (table) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/db-admin/check-duplicates?tableName=${table}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDuplicates(res.data);
    } catch (error) {
      toast.error(`❌ Error al verificar índices duplicados en ${table}`);
    }
  };

  const checkDuplicates = async () => {
    setLoading(true);
    await fetchDuplicates(selectedTable);
    if (duplicates.count === 0) {
      toast.success(`✅ No hay índices duplicados en ${selectedTable}`);
    } else {
      toast.warning(`⚠️ Hay ${duplicates.count} índices duplicados en ${selectedTable}`);
    }
    setLoading(false);
  };

  const cleanDuplicates = async () => {
    if (!confirm(`¿Eliminar todos los índices duplicados en la tabla ${selectedTable}?`)) return;
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/db-admin/clean-duplicates`, { tableName: selectedTable }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
      fetchDuplicates(selectedTable);
      fetchDatabaseInfo();
    } catch (error) {
      toast.error('❌ Error al limpiar índices');
    } finally {
      setLoading(false);
    }
  };

  const backup = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/db-admin/backup`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.setAttribute('download', `backup_${timestamp}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('✅ Backup descargado');
    } catch (error) {
      toast.error('❌ Error al generar backup');
    } finally {
      setLoading(false);
    }
  };

  const runMigrations = async () => {
    if (!confirm('Ejecutar migraciones pendientes? Puede cambiar la estructura de la base de datos.')) return;
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/db-admin/migrate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error('❌ Error al ejecutar migraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (e) => {
    const table = e.target.value;
    setSelectedTable(table);
    fetchDuplicates(table);
  };

  return (
    <AdminLayout title="Administración de Base de Datos">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      <div className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h3 className="font-semibold text-blue-800">¿Qué puedes hacer aquí?</h3>
          <ul className="list-disc pl-5 mt-2 text-sm text-blue-700 space-y-1">
            <li><strong>Ver estructura:</strong> Listado de todas las tablas, número de filas y tamaño.</li>
            <li><strong>Índices duplicados:</strong> Identifica y elimina índices repetidos que pueden ralentizar la base de datos.</li>
            <li><strong>Backup:</strong> Descarga una copia de seguridad completa (dump SQL).</li>
            <li><strong>Migraciones:</strong> Aplica cambios controlados al esquema de la base de datos.</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-2">Información de la base de datos</h2>
          <p className="text-gray-600 mb-4">Base de datos: <strong>{dbInfo.databaseName}</strong> | Tamaño total: <strong>{dbInfo.totalSize}</strong></p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tabla</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filas (aprox)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamaño</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Índices</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dbInfo.tables.map(table => (
                  <tr key={table.tablename}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{table.tablename}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.rows || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <details>
                        <summary className="cursor-pointer text-blue-600">Ver índices ({table.indexes.length})</summary>
                        <ul className="mt-2 list-disc pl-5 text-xs">
                          {table.indexes.map(idx => (
                            <li key={idx.indexname} className="font-mono">{idx.indexname}</li>
                          ))}
                        </ul>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Herramientas de mantenimiento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Índices duplicados</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <select value={selectedTable} onChange={handleTableChange} className="border rounded px-2 py-1 text-sm">
                  {dbInfo.tables.map(t => (
                    <option key={t.tablename} value={t.tablename}>{t.tablename}</option>
                  ))}
                </select>
                <button onClick={checkDuplicates} disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50">
                  Verificar duplicados
                </button>
                <button onClick={cleanDuplicates} disabled={loading || duplicates.count === 0} className={`px-3 py-1 rounded disabled:opacity-50 ${duplicates.count > 0 ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-400 cursor-not-allowed'} text-white`}>
                  Limpiar duplicados
                </button>
              </div>
              {duplicates.count > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  Se encontraron {duplicates.count} índices duplicados.
                  <ul className="list-disc pl-5">
                    {duplicates.duplicates.map(name => <li key={name} className="font-mono">{name}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Backup y migraciones</h3>
              <div className="flex gap-2">
                <button onClick={backup} disabled={loading} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50">
                  Descargar backup
                </button>
                <button onClick={runMigrations} disabled={loading} className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50">
                  Ejecutar migraciones
                </button>
              </div>
            </div>
          </div>
          {loading && <p className="mt-4 text-gray-600">Procesando...</p>}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(AdminDatabase);