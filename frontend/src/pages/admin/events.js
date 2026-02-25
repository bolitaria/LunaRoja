import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'webinar',
    datetime: '',
    locationType: 'online',
    onlineLink: '',
    placeName: '',
    address: '',
    latitude: '',
    longitude: '',
    registrationLink: '',
    recordingUrl: '',
    isLive: true
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(res.data);
    } catch (error) {
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/events/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Evento actualizado');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/events`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Evento creado');
      }
      setForm({
        title: '',
        description: '',
        type: 'webinar',
        datetime: '',
        locationType: 'online',
        onlineLink: '',
        placeName: '',
        address: '',
        latitude: '',
        longitude: '',
        registrationLink: '',
        recordingUrl: '',
        isLive: true
      });
      setEditingId(null);
      setShowForm(false);
      fetchEvents();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleEdit = (event) => {
    setForm({
      title: event.title,
      description: event.description || '',
      type: event.type,
      datetime: event.datetime.slice(0, 16),
      locationType: event.locationType || 'online',
      onlineLink: event.onlineLink || '',
      placeName: event.placeName || '',
      address: event.address || '',
      latitude: event.latitude || '',
      longitude: event.longitude || '',
      registrationLink: event.registrationLink || '',
      recordingUrl: event.recordingUrl || '',
      isLive: event.isLive
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar evento?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Evento eliminado');
      fetchEvents();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <AdminLayout title="Administrar Eventos">
      <ToastContainer />
      <button
        onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({
          title: '', description: '', type: 'webinar', datetime: '', locationType: 'online',
          onlineLink: '', placeName: '', address: '', latitude: '', longitude: '',
          registrationLink: '', recordingUrl: '', isLive: true
        }); }}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {showForm ? 'Cancelar' : 'Nuevo evento'}
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
            <label className="block text-gray-700 mb-2">Tipo *</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="webinar">Webinar</option>
              <option value="talk">Charla</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Fecha y hora *</label>
            <input
              type="datetime-local"
              name="datetime"
              value={form.datetime}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {/* Tipo de ubicación */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Tipo de ubicación</label>
            <select
              name="locationType"
              value={form.locationType}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="online">Online</option>
              <option value="presential">Presencial</option>
            </select>
          </div>

          {form.locationType === 'online' && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Enlace online (Zoom/Meet/etc.)</label>
              <input
                type="url"
                name="onlineLink"
                value={form.onlineLink}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          )}

          {form.locationType === 'presential' && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nombre del lugar</label>
                <input
                  type="text"
                  name="placeName"
                  value={form.placeName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Latitud (opcional)</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Longitud (opcional)</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Enlace de registro (opcional)</label>
            <input
              type="url"
              name="registrationLink"
              value={form.registrationLink}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">URL de grabación (después del evento)</label>
            <input
              type="url"
              name="recordingUrl"
              value={form.recordingUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isLive"
                checked={form.isLive}
                onChange={handleChange}
                className="mr-2"
              />
              <span>Evento en vivo (mostrar como próximo)</span>
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
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Fecha/Hora</th>
                <th className="px-6 py-3 text-left">Ubicación</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => {
                const eventDate = new Date(event.datetime);
                const now = new Date();
                const isPast = eventDate < now;
                return (
                  <tr key={event.id} className="border-t">
                    <td className="px-6 py-4">{event.title}</td>
                    <td className="px-6 py-4">{event.type === 'webinar' ? 'Webinar' : 'Charla'}</td>
                    <td className="px-6 py-4">{eventDate.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {event.locationType === 'online' ? 'Online' : event.placeName || 'Presencial'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        !event.isLive ? 'bg-gray-200' :
                        isPast ? 'bg-gray-200' : 'bg-green-200 text-green-800'
                      }`}>
                        {!event.isLive ? 'Grabación' : isPast ? 'Pasado' : 'Próximo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button onClick={() => handleEdit(event)} className="text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default withAuth(AdminEvents);