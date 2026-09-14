import { useState } from 'react';
import { toast } from 'react-toastify';
import { FaFileAlt, FaLock, FaLink, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';
import api from '../lib/axios';

/**
 * DocumentManager — Componente reutilizable para gestionar documentos
 * de cualquier entidad (action, campaign, bds, report).
 *
 * Modos:
 *   - Documentos públicos  → upload, visible en web pública
 *   - Documentos privados  → upload, visible solo para admins con scope
 *   - Enlace externo (Drive) → link, siempre admin
 *
 * Formato de cada documento en el estado `documents`:
 *   {
 *     id: 'tmp-XXX' | 123,           // temporal (nuevo) o id de BD (existente)
 *     name: 'Manifiesto',            // o `title` si viene de BD
 *     source: 'upload' | 'link',
 *     file: File | null,             // solo si source='upload' y es nuevo
 *     externalUrl: string | null,    // solo si source='link'
 *     visibility: 'public' | 'admin',
 *     filePath: string | null,       // solo si viene de BD
 *     isNew: boolean,                // true si es nuevo (aún no en BD)
 *   }
 *
 * Al enviar, el form padre debe convertirlo a FormData:
 *   documents.forEach((doc, idx) => {
 *     formData.append(`documents[${idx}][name]`, doc.name || doc.title);
 *     formData.append(`documents[${idx}][source]`, doc.source);
 *     formData.append(`documents[${idx}][visibility]`, doc.visibility);
 *     if (doc.source === 'upload' && doc.file) {
 *       formData.append(`documents[${idx}][file]`, doc.file);
 *     } else if (doc.source === 'link') {
 *       formData.append(`documents[${idx}][externalUrl]`, doc.externalUrl);
 *     }
 *   });
 */

const DEFAULT_LIMITS = {
  action:   { maxPublic: 5, maxAdmin: 5, maxLinks: 1 },
  campaign: { maxPublic: 5, maxAdmin: 5, maxLinks: 1 },
  bds:      { maxPublic: 5, maxAdmin: 5, maxLinks: 1 },
  report:   { maxPublic: 1, maxAdmin: 0, maxLinks: 0 },
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
  maxLinks,
  className = '',
  section = 'all',
}) {
  const defaults = DEFAULT_LIMITS[entityType] || DEFAULT_LIMITS.action;
  const limitPublic = maxPublic !== undefined ? maxPublic : defaults.maxPublic;
  const limitAdmin = maxAdmin !== undefined ? maxAdmin : defaults.maxAdmin;
  const limitLinks = maxLinks !== undefined ? maxLinks : defaults.maxLinks;

  const [adding, setAdding] = useState(null); // 'public' | 'admin' | 'link' | null
  const [draftName, setDraftName] = useState('');
  const [draftFile, setDraftFile] = useState(null);
  const [draftUrl, setDraftUrl] = useState('');

  const publics = documents.filter((d) => d.source === 'upload' && d.visibility === 'public');
  const admins  = documents.filter((d) => d.source === 'upload' && d.visibility === 'admin');
  const links   = documents.filter((d) => d.source === 'link');

  const resetDraft = () => {
    setAdding(null);
    setDraftName('');
    setDraftFile(null);
    setDraftUrl('');
  };

  const handleAdd = (kind) => {
    if (!draftName.trim()) {
      toast.warning('El nombre es obligatorio');
      return;
    }

    if (kind === 'public' || kind === 'admin') {
      if (!draftFile) {
        toast.warning('Selecciona un fichero');
        return;
      }
      const max = kind === 'public' ? limitPublic : limitAdmin;
      const current = kind === 'public' ? publics.length : admins.length;
      if (current >= max) {
        toast.warning(`Máximo ${max} documento(s) alcanzado`);
        return;
      }
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
    } else if (kind === 'link') {
      if (!draftUrl.trim()) {
        toast.warning('Introduce una URL');
        return;
      }
      if (!/^https?:\/\/.+/.test(draftUrl.trim())) {
        toast.warning('La URL debe empezar por http:// o https://');
        return;
      }
      if (links.length >= limitLinks) {
        toast.warning(`Máximo ${limitLinks} enlace(s) alcanzado`);
        return;
      }
      onChange([
        ...documents,
        {
          id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: draftName.trim(),
          source: 'link',
          file: null,
          externalUrl: draftUrl.trim(),
          visibility: 'admin', // forzado por backend
          filePath: null,
          isNew: true,
        },
      ]);
    }

    resetDraft();
  };

  const handleRemove = async (doc) => {
    const isExisting =
      typeof doc.id === 'number' ||
      (typeof doc.id === 'string' && /^\d+$/.test(doc.id));

    if (isExisting) {
      if (!confirm(`¿Eliminar el documento "${displayName(doc)}"? Esta acción no se puede deshacer.`)) return;
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

  // ────────────────────────────────────────────────────────────
  // Render secciones
  // ────────────────────────────────────────────────────────────

  const renderUploadSection = (kind, title, icon, docs, limit, color) => {
    const isFull = docs.length >= limit;
    const isAdding = adding === kind;
    // Si el componente se usa con section (lo pone el padre), no pintamos
    // la barra lateral aquí: la hereda del bloque superior.
    const flat = section !== 'all';
    const containerCls = flat ? 'relative' : `border-l-2 ${color.border} pl-4 relative`;
    const dot = flat ? null : (
      <span className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full ${color.dot}`}></span>
    );

    return (
      <div className={containerCls}>
        {dot}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            {icon} {title}
            <span className={`text-sm font-normal ${isFull ? 'text-red-600' : 'text-gray-500'}`}>
              ({docs.length} / {limit})
            </span>
          </h3>
          <button
            type="button"
            onClick={() => { resetDraft(); setAdding(kind); }}
            disabled={isFull || isAdding}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              isFull || isAdding
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-50'
            }`}
          >
            <FaPlus className="w-3 h-3" /> Añadir
          </button>
        </div>

        {isAdding && (
          <div className="bg-gray-50 p-3 rounded-lg mb-2 space-y-2">
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
        )}

        <ul className="space-y-1">
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
      </div>
    );
  };

  const renderLinkSection = () => {
    const isFull = links.length >= limitLinks;
    const isAdding = adding === 'link';
    const flat = section !== 'all';
    const containerCls = flat ? 'relative' : 'border-l-2 border-blue-500 pl-4 relative';
    const dot = flat ? null : (
      <span className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-blue-500`}></span>
    );

    return (
      <div className={containerCls}>
        {dot}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FaLink className="text-fuchsia-500" /> Enlace externo (Drive)
            <span className={`text-sm font-normal ${isFull ? 'text-red-600' : 'text-gray-500'}`}>
              ({links.length} / {limitLinks})
            </span>
          </h3>
          <button
            type="button"
            onClick={() => { resetDraft(); setAdding('link'); }}
            disabled={isFull || isAdding}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              isFull || isAdding
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-50'
            }`}
          >
            <FaPlus className="w-3 h-3" /> Añadir
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-2">
          Los enlaces externos <strong>solo son visibles para administradores</strong>. Úsalos para enlazar carpetas de Drive u otros recursos internos.
        </p>

        {isAdding && (
          <div className="bg-gray-50 p-3 rounded-lg mb-2 space-y-2">
            <input
              type="text"
              placeholder="Nombre del enlace (ej: Carpeta Drive material)"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
              autoFocus
            />
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAdd('link')}
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
        )}

        <ul className="space-y-1">
          {links.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between bg-white border border-gray-200 p-2.5 rounded-lg text-sm"
            >
              <span className="flex items-center gap-2 truncate">
                <FaLink className="text-blue-500 flex-shrink-0" />
                <span className="truncate">{displayName(doc)}</span>
                <a
                  href={doc.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex-shrink-0"
                >
                  abrir ↗
                </a>
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
      </div>
    );
  };

  const showPublic = section === 'all' || section === 'public';
  const showPrivate = section === 'all' || section === 'private';

  const wrapperSpace = section === 'all' ? 'space-y-6' : 'space-y-4';

  return (
    <div className={`${wrapperSpace} ${className}`}>
      {showPublic && renderUploadSection(
        'public',
        'Archivos públicos',
        <FaFileAlt className="text-fuchsia-500" />,
        publics,
        limitPublic,
        { border: 'border-green-500', dot: 'bg-green-500' }
      )}

      {showPrivate && renderUploadSection(
        'admin',
        'Archivos privados',
        <FaLock className="text-fuchsia-500" />,
        admins,
        limitAdmin,
        { border: 'border-rose-400', dot: 'bg-rose-400' }
      )}

      {showPrivate && renderLinkSection()}
    </div>
  );
}
