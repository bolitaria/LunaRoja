import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import api from '../../lib/axios';
import Layout from '../../components/Layout';
import { categoryLabels, categoryStyles } from '../../utils/categoryConfig';

// ─── ICONOS DE PLATAFORMA ───
const platformIcons = {
  signal: (
    <Image src="/assets/icons/Signal-Logo.svg" alt="Signal" width={24} height={24} className="w-6 h-6" />
  ),
  whatsapp: (
    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  telegram: (
    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.26.33-.538.33l.193-2.74 4.99-4.51c.217-.193-.047-.3-.334-.108l-6.14 3.87-2.64-.82c-.575-.18-.59-.58.12-.86l10.35-3.99c.48-.17.89.11.73.86z"/>
    </svg>
  ),
};

// ─── COMBOBOX (buscador desplegable) ───
function ComboBox({ label, options, onChange, loading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = searchTerm
    ? options.filter(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const handleSelect = (option) => {
    onChange(option);
    setSearchTerm(option.name);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
    if (val === '') onChange(null);
  };

  return (
    <div className="relative w-full sm:w-48" ref={wrapperRef}>
      <input
        type="text"
        placeholder={loading ? 'Cargando...' : label}
        className="w-full px-3 py-2 rounded-xl border border-fuchsia-300 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-fuchsia-300 focus:border-fuchsia-500 outline-none transition pr-8 placeholder-gray-400"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => !loading && setIsOpen(true)}
        onClick={() => !loading && setIsOpen(true)}
        disabled={loading}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        onClick={(e) => { e.stopPropagation(); if (!loading) setIsOpen(!isOpen); }}
        disabled={loading}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
      {isOpen && !loading && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {filtered.length > 0 ? (
            filtered.map(opt => (
              <li
                key={opt.id + (opt.type || '')}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-fuchsia-50 cursor-pointer transition"
                onClick={() => handleSelect(opt)}
              >
                {opt.name}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-sm text-gray-400">{searchTerm ? 'Sin resultados' : 'No hay opciones'}</li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ───
export default function GruposChats() {
  const router = useRouter();
  const { platform: platformFromQuery, filterType, actionId } = router.query;

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [bdsList, setBdsList] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [resetCount, setResetCount] = useState(0);
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, campRes, bdsRes, actRes] = await Promise.all([
          api.get('/chat-groups'),
          api.get('/campaigns'),
          api.get('/bds'),
          api.get('/actions'),
        ]);
        setGroups(groupsRes.data);
        setCampaigns(campRes.data);
        setBdsList(bdsRes.data);
        setActions(actRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
        setLoadingLists(false);
      }
    };
    fetchData();
  }, []);

  // ─── COLOR DE ACENTO PARA BORDE ───
  const getAccentColor = (group) => {
    if (group.campaign) return group.campaign.color || '#d1d5db';
    if (group.action) {
      const cat = group.action.category;
      if (cat && categoryStyles[cat]) return categoryStyles[cat].borderColor || '#d1d5db';
    }
    return '#d1d5db';
  };

  // ─── FILTRADO COMBINADO (incluye filtros de URL) ───
  const filteredGroups = (() => {
    let result = [...groups];

    // Filtro por campaña normal (ComboBox)
    if (selectedCampaignFilter?.type === 'campaign') {
      result = result.filter(g => g.campaignId == selectedCampaignFilter.id);
    }
    // Filtro por campaña BDS (ComboBox)
    if (selectedCampaignFilter?.type === 'bds') {
      const bdsId = selectedCampaignFilter.id;
      const actionIdsForBds = actions
        .filter(a => a.bdsId == bdsId)
        .map(a => a.id);
      result = result.filter(g => g.actionId && actionIdsForBds.includes(g.actionId));
    }

    // Filtro por acción (ComboBox)
    if (selectedAction) {
      result = result.filter(g => g.actionId == selectedAction);
    }

    // Filtro por actionId desde URL (para enlaces desde acción)
    if (actionId) {
      result = result.filter(g => g.actionId == actionId);
    }

    // Filtro contextual: filterType (campaign / bds)
    if (filterType === 'campaign') {
      result = result.filter(g => g.campaignId != null);
    } else if (filterType === 'bds') {
      result = result.filter(g => {
        const action = actions.find(a => a.id === g.actionId);
        return action && action.bdsId != null;
      });
    }

    return result;
  })();

  // ─── PLATAFORMAS A MOSTRAR (según query) ───
  const defaultOrder = ['signal', 'whatsapp', 'telegram'];
  const platformOrder = platformFromQuery ? [platformFromQuery] : defaultOrder;

  const sections = platformOrder.map(platform => ({
    platform,
    groups: filteredGroups.filter(g => g.platform === platform)
  }));

  // ─── OPCIONES UNIFICADAS PARA “Buscar en Campañas” ───
  const campaignOptions = [
    ...campaigns.map(c => ({ id: c.id, name: c.name, type: 'campaign' })),
    ...bdsList.map(b => ({ id: b.id, name: b.name, type: 'bds' })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const actionOptions = actions.map(a => ({ id: a.id, name: a.title }));

  const clearFilters = () => {
    setSelectedCampaignFilter(null);
    setSelectedAction('');
    // No limpiamos los parámetros de la URL porque eso requeriría router.replace
    // Pero permitimos que los combos se reseteen y el filtro contextual se mantiene.
    // Si quieres limpiar también actionId, filterType, deberíamos redirigir a /grupos-chat
    // pero con eso borraríamos la navegación anterior. Mejor dejar que el usuario limpie manualmente.
    setResetCount(c => c + 1);
  };

  return (
    <Layout title="Grupos - Voces Palestinas por la Justicia" bgClass="bg-gradient-to-b from-[#FE2C55]/10 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8 pb-16">
        {/* Título y frase centrados */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-700 mb-2">Grupos de Chat</h1>
          <p className="text-gray-500">
            Conecta con Signal, WhatsApp o Telegram según tu región o campaña.
          </p>
        </div>

        {/* Filtros a la derecha + botón limpiar circular */}
        <div className="flex justify-end items-center gap-3 mb-8">
          <ComboBox
            key={`camp-${resetCount}`}
            label="Buscar en Campañas"
            options={campaignOptions}
            onChange={(opt) => setSelectedCampaignFilter(opt ? { type: opt.type, id: opt.id } : null)}
            loading={loadingLists}
          />
          <ComboBox
            key={`act-${resetCount}`}
            label="Buscar en Acciones"
            options={actionOptions}
            onChange={(opt) => {
              setSelectedAction(opt ? opt.id : '');
            }}
            loading={loadingLists}
          />
          {(selectedCampaignFilter || selectedAction) && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-fuchsia-500 text-fuchsia-600 hover:bg-fuchsia-50 transition"
              aria-label="Limpiar filtros"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(platformOrder.length)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="h-7 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span className="text-lg">No hay grupos disponibles</span>
            <button onClick={clearFilters} className="mt-4 text-fuchsia-600 hover:underline text-sm">Limpiar filtros</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sections.map(section => (
              <div key={section.platform}>
                <h2 className="text-xl font-bold text-gray-700 mb-4 text-center capitalize flex items-center justify-center gap-2">
                  {platformIcons[section.platform]}
                  <span>{section.platform}</span>
                </h2>
                <div className="space-y-4">
                  {section.groups.map(group => {
                    const accentColor = getAccentColor(group);
                    const isCampaign = !!group.campaign;
                    const campaignColor = group.campaign?.color;
                    const actionCat = group.action?.category;
                    const catStyle = actionCat ? categoryStyles[actionCat] : null;
                    const catLabel = actionCat ? categoryLabels[actionCat] : null;
                    const isBdsAction = group.action?.bdsId ? true : false;

                    return (
                      <a
                        key={group.id}
                        href={group.link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md hover:border-fuchsia-200 transition-all duration-200"
                        style={{ borderLeft: `2px solid ${accentColor}` }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              {platformIcons[group.platform] || platformIcons.whatsapp}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold text-gray-700 truncate group-hover:text-fuchsia-600">
                                {group.name}
                              </h3>
                              <p className="text-sm text-gray-500 capitalize">{group.platform}</p>
                            </div>
                          </div>

                          {/* Etiqueta de campaña (con enlace) */}
                          {isCampaign && group.campaign && (
                            <Link
                              href={`/campanas/${group.campaign.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium no-underline"
                              style={{
                                backgroundColor: `${campaignColor}20`,
                                color: '#1f2937',
                                border: `1px solid ${campaignColor}`,
                              }}
                            >
                              🎯 {group.campaign.name}
                            </Link>
                          )}

                          {/* Etiqueta de acción + posible BDS */}
                          {!isCampaign && group.action && catStyle && (
                            <div className="flex-shrink-0 flex items-center gap-1">
                              <Link
                                href={`/acciones/${group.action.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs px-3 py-1 rounded-full font-medium border no-underline"
                                style={{
                                  backgroundColor: catStyle.backgroundColor,
                                  color: '#1f2937',
                                  borderColor: catStyle.borderColor,
                                }}
                              >
                                {catLabel || group.action.title}
                              </Link>
                              {isBdsAction && (
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700 border border-red-200">
                                  🚫 BDS
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {group.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{group.description}</p>
                        )}

                        <div className="text-sm text-gray-400 mt-2 mb-3">
                          {group.region ? `📍 ${group.region}` : ''}
                        </div>

                        <div className="flex justify-end items-center">
                          <span className="text-sm text-fuchsia-600 font-medium group-hover:underline">
                            Quiero unirme →
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}