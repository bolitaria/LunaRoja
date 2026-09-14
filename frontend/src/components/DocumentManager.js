import { useState } from 'react';
import { toast } from 'react-toastify';
import { FaFileAlt, FaTrash } from 'react-icons/fa';
import api from '../lib/axios';

/**
 * DocumentManager — Gestor de documentos subidos (upload) para una entidad.
 *
 * Modos (prop `section`):
 *   - 'public'  → solo documentos públicos (visibilidad='public')
 *   - 'private' → solo documentos privados (visibilidad='admin')
 *   - 'all'     → muestra ambas secciones apiladas
 *
 * El componente NO añade bordes laterales. Se asume que el padre lo coloca
 * dentro de una sección con su propio `border-l-2` (verde para públicos,
 * rojo/rosa para privados). Aquí solo renderizamos:
 *   • Un dot de color (verde/rojo) + emoji + título + contador
 *   • La lista de documentos existentes
 *   • Una zona dashed clickable para añadir
 *
 * Formato de cada documento en el array `documents`:
 *   {
 *     id: 'tmp-XXX' | 123,
 *     name: 'Manifiesto',
 *     source: 'upload',
 *     file: File | null,         // solo si es nuevo
 *     visibility: 'public' | 'admin',
 *     filePath: string | null,   // solo si viene de BD
 *     isNew: boolean,
 *   }
 */

const DEFAULTS = {
  action:   { maxPublic: 5, maxAdmin: 5 },
  campaign: { maxPublic: 5, maxAdmin: 5 },
  bds:      { maxPublic: 5, maxAdmin: 5 },
  report:   { maxPublic: 1, maxAdmin: 0 },
};

function displayName(doc) {
  return doc.name || doc.title || 'Sin nombre';
}

export default function DocumentManager({
  entityType = 'action',
  documents = [],
  onChange,
  maxPublic,
  maxAdmin,
  className = '',
  section = 'all',
  publicHint = null,
  adminHint = null,
}) {
  const defaults = DEFAULTS[entityType] || DEFAULTS.action;
  const limitPublic = maxPublic !== undefined ? maxPublic : defaults.maxPublic;
  const limitAdmin  = maxAdmin  !== undefined ? maxAdmin  : defaults.maxAdmin;

  const [adding, setAdding] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [draftFile, setDraftFile] = useState(null);

  const publics = documents.filter((d) => d.source === 'upload' && d.visibility === 'public');
  const admins  = documents.filter((d) => d.source === 'upload' && d.visibility === 'admin');

  const resetDraft = () => { setAdding(null); setDraftName(''); setDraftFile(null); };

  const handleAdd = (kind) => {
    if (!draftName.trim()) { toast.warning('El nombre es obligatorio'); return; }
    if (!draftFile) { toast.warning('Selecciona un fichero'); return; }

    const max = kind === 'public' ? limitPublic : limitAdmin;
    const current = kind === 'public' ? publics.length : admins.length;
    if (current >= max) { toast.warning(`Máximo ${max} documento(s) alcanzado`); return; }

    onChange([
      ...documents,
      {
        id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: draftName.trim(),
        source: 'upload',
        file: draftFile,
        externalUrl: null,
        visibility: kind === 'public' ? 'public' : 'admin',
        filePath: null,
        isNew: true,
      },
    ]);
    resetDraft();
  };

  const handleRemove = async (doc) => {
    const isExisting =
      typeof doc.id === 'number' ||
      (typeof doc.id === 'string' && /^\d+$/.test(doc.id));

    if (isExisting) {
      if (!confirm(`¿Eliminar "${displayName(doc)}"? Esta acción no se puede deshacer.`)) return;
      try {
        await api.delete(`/documents/${doc.id}`);
        toast.success('Documento eliminado');
      } catch (err) {
        console.error('Error eliminando documento:', err);
        toast.error('Error al eliminar el documento');
        return;
      }
    }

    onChange(documents.filter((d) => d.id !== doc.id));
  };

  const renderSection = (kind) => {
    const isPublic = kind === 'public';
    const docs = isPublic ? publics : admins;
    const limit = isPublic ? limitPublic : limitAdmin;

    if (limit === 0) return null;

    const title = isPublic ? 'Archivos públicos' : 'Archivos privados';
    const icon = isPublic ? '🔓' : '🔐';
    const dotColor = isPublic ? 'bg-green-500' : 'bg-rose-400';
    const hint = isPublic ? publicHint : adminHint;
    const isFull = docs.length >= limit;
    const isAdding = adding === kind;

    return (
      <div className="relative">
        {/* Header: dot + emoji + título + contador */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <span>{icon}</span> {title}
            <span className={`text-sm font-normal ${isFull ? 'text-red-600' : 'text-gray-500'}`}>
              ({docs.length} / {limit})
            </span>
          </h3>
        </div>

        {hint && <p className="text-sm text-gray-400 mb-2">{hint}</p>}

        {/* Lista de documentos existentes */}
        {docs.length > 0 && (
          <ul className="space-y-1 mb-3">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between bg-white border border-gray-200 p-2.5 rounded-lg text-sm"
              >
                <span className="flex items-center gap-2 truncate">
                  <FaFileAlt className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{displayName(doc)}</span>
                  {doc.isNew && <span className="text-xs text-fuchsia-600">(nuevo)</span>}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(doc)}
                  className="text-red-600 hover:text-red-800 flex-shrink-0 ml-2"
                  title="Eliminar"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Mini-form O zona clickable */}
        {isAdding ? (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
            <input
              type="text"
              placeholder="Nombre del documento (ej: Manifiesto 2026)"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-fuchsia-300 focus:border-fuchsia-500"
              autoFocus
            />
            <input
              type="file"
              onChange={(e) => setDraftFile(e.target.files[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAdd(kind)}
                className="border border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-50 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Añadir
              </button>
              <button
                type="button"
                onClick={resetDraft}
                className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { resetDraft(); setAdding(kind); }}
            disabled={isFull}
            className={`w-full border-2 border-dashed rounded-lg py-4 transition-colors flex items-center justify-center gap-2 text-sm ${
              isFull
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-gray-300 text-gray-500 hover:border-fuchsia-400 hover:text-fuchsia-600 hover:bg-fuchsia-50'
            }`}
          >
            {isFull ? (
              <>Límite de {limit} alcanzado</>
            ) : (
              <>
                <span>📎</span> Click para añadir documento
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  const showPublic = section === 'all' || section === 'public';
  const showPrivate = section === 'all' || section === 'private';

  return (
    <div className={`space-y-6 ${className}`}>
      {showPublic && renderSection('public')}
      {showPrivate && renderSection('admin')}
    </div>
  );
}
