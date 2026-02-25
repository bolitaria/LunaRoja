import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', file: null });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (error) {
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleChange = (e) => {
    if (e.target.name === 'file') {
      setForm({ ...form, file: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    if (form.file) formData.append('file', form.file);

    try {
      if (editingId) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/reports/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Reporte actualizado');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reports`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Reporte creado');
      }
      setForm({ title: '', description: '', file: null });
      setEditingId(null);
      setShowForm(false);
      fetchReports();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleEdit = (report) => {
    setForm({
      title: report.title,
      description: report.description || '',
      file: null
    });
    setEditingId(report.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar reporte?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Reporte eliminado');
      fetchReports();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <AdminLayout title="Administrar Reportes">
      <ToastContainer />
      <button
        onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', description: '', file: null }); }}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {showForm ? 'Cancelar' : 'Nuevo reporte'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8" encType="multipart/form-data">
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
            <label className="block text-gray-700 mb-2">Archivo PDF *</label>
            <input
              type="file"
              name="file"
              accept=".pdf"
              onChange={handleChange}
              required={!editingId} // Solo requerido si es nuevo
              className="w-full"
            />
            {editingId && <p className="text-sm text-gray-500">Dejar vacío para mantener el actual</p>}
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
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Archivo</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id} className="border-t">
                  <td className="px-6 py-4">{report.title}</td>
                  <td className="px-6 py-4">{new Date(report.publishedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <a href={`${process.env.NEXT_PUBLIC_API_URL}${report.fileUrl}`} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                      Ver PDF
                    </a>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => handleEdit(report)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleDelete(report.id)} className="text-red-600 hover:underline">Eliminar</button>
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

export default withAuth(AdminReports);