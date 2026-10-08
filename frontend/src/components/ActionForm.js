// frontend/src/components/ActionForm.js
import { useState } from 'react';

export default function ActionForm({
  initialData = {},
  onSubmit,
  onCancel,
  hideCampaignSelect = false,
  campaigns = [],
  fixedCampaignId = null,
  fixedBdsId = null,
  initialLinkType = 'none',
}) {
  // Determinar el linkType inicial según props
  const getInitialLinkType = () => {
    if (fixedCampaignId) return 'campaign';
    if (fixedBdsId) return 'bds';
    return initialLinkType || (initialData.campaignId ? 'campaign' : initialData.bdsId ? 'bds' : 'none');
  };

  const [linkType, setLinkType] = useState(getInitialLinkType());
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
    campaignId: fixedCampaignId || initialData.campaignId || '',
    bdsId: fixedBdsId || initialData.bdsId || '',
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
    if (!form.title.trim()) {
      alert('El título es obligatorio');
      return;
    }
    if (!form.datetime) {
      alert('La fecha y hora son obligatorias');
      return;
    }
    const groupsArray = form.groups
      ? form.groups.split(',').map((g) => g.trim()).filter(Boolean)
      : [];
    const data = { ...form, groups: groupsArray };

    // Ajustar IDs según linkType
    if (linkType === 'campaign') {
      data.bdsId = '';
    } else if (linkType === 'bds') {
      data.campaignId = '';
    } else {
      data.campaignId = '';
      data.bdsId = '';
    }
    onSubmit(data);
  };

  // Si hay fixedCampaignId o fixedBdsId, bloqueamos el selector de linkType
  const linkTypeLocked = fixedCampaignId || fixedBdsId;

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
            {linkType !== 'bds' && <option value="bds">Acción BDS</option>}
            <option value="solidarity_action">Acción Solidaria</option>
            <option value="talk">Charla</option>
            <option value="strike">Huelga</option>
            <option value="protest">Manifestación</option>
            <option value="march">Marcha</option>
            <option value="workshop">Taller</option>
            <option value="webinar">Webinar</option>
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

      {/* Selector de vinculación */}
      {!hideCampaignSelect && !linkTypeLocked && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="linkType"
                value="none"
                checked={linkType === 'none'}
                onChange={() => setLinkType('none')}
              />
              <span>Ninguna</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="linkType"
                value="campaign"
                checked={linkType === 'campaign'}
                onChange={() => setLinkType('campaign')}
              />
              <span>Campaña</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="linkType"
                value="bds"
                checked={linkType === 'bds'}
                onChange={() => setLinkType('bds')}
              />
              <span>BDS</span>
            </label>
          </div>
        </div>
      )}

      {/* Selección de campaña/BDS */}
      {linkType === 'campaign' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaña</label>
          <select
            name="campaignId"
            value={form.campaignId}
            onChange={handleChange}
            disabled={!!fixedCampaignId}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 disabled:bg-gray-100"
          >
            <option value="">-- Seleccionar campaña --</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      {linkType === 'bds' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaña BDS</label>
          <select
            name="bdsId"
            value={form.bdsId}
            onChange={handleChange}
            disabled={!!fixedBdsId}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 disabled:bg-gray-100"
          >
            <option value="">-- Seleccionar BDS --</option>
            {campaigns.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
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