import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Link from 'next/link';

const getLocalDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CampanaDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState(null);
  const [actions, setActions] = useState([]);
  const [campaignGroups, setCampaignGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          const campaignRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}`);
          setCampaign(campaignRes.data);
          const actionsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions?campaignId=${id}`);
          setActions(actionsRes.data);
          const groupsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/chats-groups?campaignId=${id}`);
          setCampaignGroups(groupsRes.data);
        } catch (error) {
          console.error('Error fetching data', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id]);

  const actionsByDate = useMemo(() => {
    const map = new Map();
    actions.forEach(action => {
      const dateStr = getLocalDateStr(action.datetime);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr).push(action);
    });
    return map;
  }, [actions]);

  const nearestActionDate = useMemo(() => {
    const now = new Date();
    const futureActions = actions.filter(a => new Date(a.datetime) > now);
    if (futureActions.length === 0) return null;
    const sorted = futureActions.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    return new Date(sorted[0].datetime);
  }, [actions]);

  useEffect(() => {
    if (nearestActionDate) setSelectedDate(nearestActionDate);
  }, [nearestActionDate]);

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = getLocalDateStr(date);
    const actionsOnDate = actionsByDate.get(dateStr) || [];
    if (actionsOnDate.length === 0) return null;
    const now = new Date();
    const hasFuture = actionsOnDate.some(a => new Date(a.datetime) > now);
    const color = hasFuture ? 'bg-green-500' : 'bg-red-500';
    return (
      <span className={`${color} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mx-auto`}>
        {actionsOnDate.length}
      </span>
    );
  };

  const selectedDateStr = getLocalDateStr(selectedDate);
  const actionsOnSelected = actionsByDate.get(selectedDateStr) || [];

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (!campaign) return <Layout><p className="text-center py-20">Campaña no encontrada</p></Layout>;

  return (
    <Layout title={`${campaign.name} - Voces Palestinas por la Justicia`}>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: campaign.color }}></span>
          <h1 className="text-4xl font-bold text-black">{campaign.name}</h1>
        </div>
        {campaign.imageUrl && (
          <div className="mb-4">
            <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${campaign.imageUrl}`} alt={campaign.name} className="max-h-64 rounded-lg shadow" />
          </div>
        )}
        <p className="text-gray-600 mb-8">{campaign.description}</p>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Calendario</h2>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${campaign.color}10` }}>
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileContent={tileContent}
                  className="rounded-lg w-full border-0 bg-transparent"
                />
              </div>
              {actionsOnSelected.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">
                    {selectedDate.toLocaleDateString() === new Date().toLocaleDateString() ? 'Hoy' : selectedDate.toLocaleDateString()}
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {actionsOnSelected.map(action => (
                      <li key={action.id}>
                        <Link href={`/acciones/${action.id}`} className="text-blue-600 hover:underline">
                          {action.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-semibold mb-4">Acciones de esta campaña</h2>
            {actions.length === 0 ? (
              <p>No hay acciones programadas para esta campaña.</p>
            ) : (
              <ul className="space-y-3">
                {actions.map(action => {
                  const isPast = new Date(action.datetime) < new Date();
                  return (
                    <li key={action.id} className="border-l-4 pl-3 py-2" style={{ borderColor: campaign.color }}>
                      <Link href={`/acciones/${action.id}`} className="hover:underline">
                        <span className="font-medium text-lg">{action.title}</span>
                      </Link>
                      <p className="text-sm text-gray-600">
                        {new Date(action.datetime).toLocaleDateString()} - {new Date(action.datetime).toLocaleTimeString()}
                        {isPast && <span className="ml-2 text-xs text-gray-400">(Pasada)</span>}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {campaignGroups.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Grupos de Chat de esta campaña</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaignGroups.map(group => (
                <a key={group.id} href={group.link} target="_blank" rel="noopener" className="block border rounded p-4 hover:shadow transition">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{group.platform === 'telegram' ? '✈️' : '📱'}</span>
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-sm text-gray-600">{group.description}</p>
                      {group.region && <p className="text-xs text-gray-400">🌍 {group.region}</p>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}