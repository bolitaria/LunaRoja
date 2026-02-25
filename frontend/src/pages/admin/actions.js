import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminActions() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'planned',
    date: '',
    imageUrl: '',
    link: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchActions = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActions(res.data);
    } catch (error) {
      toast.error('Error al cargar acciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/actions/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Acción actualizada');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/actions`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Acción creada');
      }
      setForm({ title: '', description: '', status: 'planned', date: '', imageUrl: '', link: '' });
      setEditingId(null);
      setShowForm(false);
      fetchActions();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleEdit = (action) => {
    setForm({
      title: action.title,
      description: action.description || '',
      status: action.status,
      date: action.date,
      imageUrl: action.imageUrl || '',
      link: action.link || ''
    });
    setEditingId(action.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar acción?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/actions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Acción eliminada');
      fetchActions();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <AdminLayout title="Administrar Acciones">
      <ToastContainer />
      <button
        onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', description: '', status: 'planned', date: '', imageUrl: '', link: '' }); }}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {showForm ? 'Cancelar' : 'Nueva acción'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Título *</label>
            <input
              type="text"
              name="title"
              value={form.title}
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
            <label className="block text-gray-700 mb-2">Estado *</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="planned">Futura</option>
              <option value="in_progress">En curso</option>
              <option value="completed">Completada</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Fecha (YYYY-MM-DD) *</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">URL de imagen (opcional)</label>
            <input
              type="url"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Enlace externo (opcional)</label>
            <input
              type="url"
              name="link"
              value={form.link}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
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
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {actions.map(action => (
                <tr key={action.id} className="border-t">
                  <td className="px-6 py-4">{action.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      action.status === 'completed' ? 'bg-green-200 text-green-800' :
                      action.status === 'in_progress' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {action.status === 'completed' ? 'Completada' :
                       action.status === 'in_progress' ? 'En curso' : 'Futura'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{action.date}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => handleEdit(action)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleDelete(action.id)} className="text-red-600 hover:underline">Eliminar</button>
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

export default withAuth(AdminActions);