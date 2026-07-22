import { useState } from 'react';

export default function ActionForm({
  initialData = {},
  onSubmit,
  onCancel,
  hideCampaignSelect = false,
  campaigns = [],
}) {
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
    campaignId: initialData.campaignId || '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validar campos obligatorios
    if (!form.title.trim()) {
      alert('El título es obligatorio');
      return;
    }
    if (!form.datetime) {
      alert('La fecha y hora son obligatorias');
      return;
    }
    // Procesar grupos: convertir string en array limpio
    const groupsArray = form.groups
      ? form.groups.split(',').map((g) => g.trim()).filter(Boolean)
      : [];
    const data = { ...form, groups: groupsArray };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Título *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
          >
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
          <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha y hora *
          </label>
          <input
            type="datetime-local"
            id="datetime"
            name="datetime"
            value={form.datetime}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>
      </div>

      {!hideCampaignSelect && campaigns.length > 0 && (
        <div>
          <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-1">
            Campaña relacionada
          </label>
          <select
            id="campaignId"
            name="campaignId"
            value={form.campaignId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
          >
            <option value="">-- Ninguna --</option>
            {campaigns.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de ubicación
        </label>
        <select
          id="locationType"
          name="locationType"
          value={form.locationType}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
        >
          <option value="presencial">Presencial</option>
          <option value="online">Online</option>
        </select>
      </div>

      {form.locationType === 'online' ? (
        <div>
          <label htmlFor="onlineLink" className="block text-sm font-medium text-gray-700 mb-1">
            Enlace online
          </label>
          <input
            type="url"
            id="onlineLink"
            name="onlineLink"
            value={form.onlineLink}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            placeholder="https://meet.google.com/..."
          />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="placeName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del lugar
            </label>
            <input
              type="text"
              id="placeName"
              name="placeName"
              value={form.placeName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="registrationLink" className="block text-sm font-medium text-gray-700 mb-1">
          Enlace de registro
        </label>
        <input
          type="url"
          id="registrationLink"
          name="registrationLink"
          value={form.registrationLink}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
          placeholder="https://forms.gle/..."
        />
      </div>

      <div>
        <label htmlFor="recordingUrl" className="block text-sm font-medium text-gray-700 mb-1">
          URL de grabación
        </label>
        <input
          type="url"
          id="recordingUrl"
          name="recordingUrl"
          value={form.recordingUrl}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isLive"
          name="isLive"
          checked={form.isLive}
          onChange={handleChange}
        />
        <label htmlFor="isLive" className="text-sm text-gray-700">
          ¿Está en vivo?
        </label>
      </div>

      <div>
        <label htmlFor="groups" className="block text-sm font-medium text-gray-700 mb-1">
          Grupos (separados por coma)
        </label>
        <input
          type="text"
          id="groups"
          name="groups"
          value={form.groups}
          onChange={handleChange}
          placeholder="whatsapp, telegram, signal"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
        />
      </div>

      <div>
        <label htmlFor="documentLink" className="block text-sm font-medium text-gray-700 mb-1">
          Enlace a documento externo
        </label>
        <input
          type="url"
          id="documentLink"
          name="documentLink"
          value={form.documentLink}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-fuchsia-600 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-700 transition-colors"
        >
          {initialData.id ? 'Guardar cambios' : 'Crear acción'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}