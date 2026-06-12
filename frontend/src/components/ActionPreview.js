import React from 'react';

export default function ActionPreview({ form, featuredImage, images }) {
  const date = form.datetime ? new Date(form.datetime).toLocaleDateString() : 'Fecha no seleccionada';
  const time = form.datetime ? new Date(form.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const categoryLabels = {
    webinar: 'Webinar', talk: 'Charla', protest: 'Manifestación',
    bds: 'Acción BDS', strike: 'Huelga', march: 'Marcha',
    solidarity_action: 'Acción Solidaria', workshop: 'Taller'
  };

  const categoryColors = {
    webinar: 'bg-blue-100 text-blue-800', talk: 'bg-green-100 text-green-800',
    protest: 'bg-red-100 text-red-800', bds: 'bg-purple-100 text-purple-800',
    strike: 'bg-yellow-100 text-yellow-800', march: 'bg-orange-100 text-orange-800',
    solidarity_action: 'bg-indigo-100 text-indigo-800', workshop: 'bg-pink-100 text-pink-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
      <h2 className="text-xl font-semibold mb-4">Vista previa</h2>
      <div className="border rounded-lg p-4">
        {featuredImage && (
          <img src={featuredImage} alt="Destacada" className="w-full h-48 object-cover rounded mb-4" />
        )}
        {!featuredImage && images.length > 0 && (
          <img src={images[0]} alt="Primera imagen" className="w-full h-48 object-cover rounded mb-4" />
        )}
        <h3 className="text-2xl font-bold mb-2">{form.title || 'Título de la acción'}</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-1 rounded ${categoryColors[form.category] || 'bg-gray-200'}`}>
            {categoryLabels[form.category] || form.category}
          </span>
          <span className="text-sm text-gray-500">{date} - {time}</span>
        </div>
        <p className="text-gray-700 mb-4">{form.description || 'Descripción de la acción...'}</p>
        {form.locationType === 'online' ? (
          form.onlineLink ? (
            <a href={form.onlineLink} target="_blank" rel="noopener" className="text-blue-600 underline">
              Enlace online
            </a>
          ) : (
            <p className="text-gray-500">Evento online (enlace no definido)</p>
          )
        ) : (
          <div>
            <p><strong>Lugar:</strong> {form.placeName || 'No especificado'}</p>
            <p><strong>Dirección:</strong> {form.address || 'No especificada'}</p>
          </div>
        )}
      </div>
    </div>
  );
}