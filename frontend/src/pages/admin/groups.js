import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    description: '',
    telegramLink: '',
    isActive: true
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/working-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(res.data);
    } catch (error) {
      toast.error('Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/working-groups/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Grupo actualizado');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/working-groups`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Grupo creado');
      }
      setForm({ name: '', description: '', telegramLink: '', isActive: true });
      setEditingId(null);
      setShowForm(false);
      fetchGroups();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleEdit = (group) => {
    setForm({
      name: group.name,
      description: group.description || '',
      telegramLink: group.telegramLink,
      isActive: group.isActive
    });
    setEditingId(group.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar grupo?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/working-groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Grupo eliminado');
      fetchGroups();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <AdminLayout title="Administrar Grupos de Trabajo">
      <ToastContainer />
      <button
        onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', description: '', telegramLink: '', isActive: true }); }}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {showForm ? 'Cancelar' : 'Nuevo grupo'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Nombre del grupo *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Enlace de Telegram *</label>
            <input
              type="url"
              name="telegramLink"
              value={form.telegramLink}
              onChange={handleChange}
              required
              placeholder="https://t.me/tu_grupo"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="mr-2"
              />
              <span>Grupo activo (visible en la página pública)</span>
            </label>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Enlace Telegram</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <tr key={group.id} className="border-t">
                  <td className="px-6 py-4">{group.name}</td>
                  <td className="px-6 py-4">
                    <a href={group.telegramLink} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                      {group.telegramLink}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${group.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                      {group.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => handleEdit(group)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleDelete(group.id)} className="text-red-600 hover:underline">Eliminar</button>
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

export default withAuth(AdminGroups);