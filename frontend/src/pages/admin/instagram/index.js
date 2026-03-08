import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import Link from 'next/link';

function AdminInstagram() {
  const [accounts, setAccounts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', campaignId: '' });
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/instagram/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(res.data);
    } catch (error) {
      toast.error('Error al cargar cuentas');
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(res.data);
    } catch (error) {
      toast.error('Error al cargar campañas');
    }
  };

  useEffect(() => {
    Promise.all([fetchAccounts(), fetchCampaigns()]).then(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username) return toast.warning('Ingresa un nombre de usuario');
    setSubmitting(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/instagram/accounts`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Cuenta añadida');
      setForm({ username: '', campaignId: '' });
      fetchAccounts();
    } catch (error) {
      toast.error('Error al añadir cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/instagram/accounts/${id}`, 
        { isActive: !currentActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Estado actualizado');
      fetchAccounts();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta cuenta? También se eliminarán sus publicaciones.')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/instagram/accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Cuenta eliminada');
      fetchAccounts();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <AdminLayout title="Administrar Cuentas de Instagram">
      <ToastContainer />
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Añadir nueva cuenta</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
          <input
            type="text"
            name="username"
            placeholder="Nombre de usuario (sin @)"
            value={form.username}
            onChange={handleChange}
            className="flex-1 min-w-[200px] px-3 py-2 border rounded"
          />
          <select
            name="campaignId"
            value={form.campaignId}
            onChange={handleChange}
            className="px-3 py-2 border rounded"
          >
            <option value="">Sin campaña</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Añadiendo...' : 'Añadir cuenta'}
          </button>
        </form>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : accounts.length === 0 ? (
        <p>No hay cuentas configuradas.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Usuario</th>
                <th className="px-6 py-3 text-left">Campaña</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Último scraping</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id} className="border-t">
                  <td className="px-6 py-4">@{acc.username}</td>
                  <td className="px-6 py-4">
                    {acc.campaignId ? campaigns.find(c => c.id === acc.campaignId)?.name || '-' : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${acc.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                      {acc.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {acc.lastScraped ? new Date(acc.lastScraped).toLocaleString() : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleToggleActive(acc.id, acc.isActive)}
                      className="text-blue-600 hover:underline"
                    >
                      {acc.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default withAuth(AdminInstagram);