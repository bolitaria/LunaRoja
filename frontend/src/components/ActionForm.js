import { useState } from 'react';

export default function ActionForm({ initialData = {}, onSubmit, onCancel, hideCampaignSelect }) {
  const [form, setForm] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    category: initialData.category || 'protest',
    datetime: initialData.datetime ? new Date(initialData.datetime).toISOString().slice(0, 16) : '',
    locationType: initialData.locationType || 'presencial',
    onlineLink: initialData.onlineLink || '',
    placeName: initialData.placeName || '',
    address: initialData.address || '',
    registrationLink: initialData.registrationLink || '',
    recordingUrl: initialData.recordingUrl || '',
    isLive: initialData.isLive !== undefined ? initialData.isLive : true,
    groups: initialData.groups ? (Array.isArray(initialData.groups) ? initialData.groups.join(', ') : initialData.groups) : '',
    documentLink: initialData.documentLink || '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const groupsArray = form.groups ? form.groups.split(',').map(g => g.trim()).filter(Boolean) : [];
    const data = { ...form, groups: groupsArray };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
        <input type="text" name="title" value={form.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="protest">Protesta</option>
            <option value="webinar">Webinar</option>
            <option value="talk">Charla</option>
            <option value="bds">Acción BDS</option>
            <option value="strike">Huelga</option>
            <option value="march">Marcha</option>
            <option value="solidarity_action">Acción Solidaria</option>
            <option value="workshop">Taller</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora *</label>
          <input type="datetime-local" name="datetime" value={form.datetime} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de ubicación</label>
        <select name="locationType" value={form.locationType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
          <option value="presencial">Presencial</option>
          <option value="online">Online</option>
        </select>
      </div>
      {form.locationType === 'online' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Enlace online</label>
          <input type="url" name="onlineLink" value={form.onlineLink} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del lugar</label>
            <input type="text" name="placeName" value={form.placeName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input type="text" name="address" value={form.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Enlace de registro</label>
        <input type="url" name="registrationLink" value={form.registrationLink} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL de grabación</label>
        <input type="url" name="recordingUrl" value={form.recordingUrl} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="isLive" checked={form.isLive} onChange={handleChange} />
        <label className="text-sm text-gray-700">¿Está en vivo?</label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Grupos (separados por coma)</label>
        <input type="text" name="groups" value={form.groups} onChange={handleChange} placeholder="whatsapp, telegram" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Enlace a documento externo</label>
        <input type="url" name="documentLink" value={form.documentLink} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-fuchsia-600 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-700">
          {initialData.id ? 'Guardar cambios' : 'Crear acción'}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancelar</button>}
      </div>
    </form>
  );
}