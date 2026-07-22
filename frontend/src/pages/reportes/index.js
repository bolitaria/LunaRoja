import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import Layout from '../../components/Layout';
import ReportCard from '../../components/ReportCard';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports');
        setReports(res.data);
      } catch (error) { console.error('Error fetching reports:', error); }
      finally { setLoading(false); }
    };
    fetchReports();
  }, []);

  const handleFilter = (filter) => setActiveFilter(activeFilter === filter ? null : filter);

  const filteredReports = reports
    .filter(r => !activeFilter || r.type === activeFilter)
    .filter(r => !searchTerm || r.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const filterBtnClass = (filter) =>
    `px-4 py-2 rounded-full text-sm font-medium transition border ${
      activeFilter === filter
        ? 'bg-[#9B30FF] text-white border-[#9B30FF] shadow-md'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50'
    }`;

  return (
    <Layout title="Blog y Reportes - Voces Palestinas por la Justicia" bgClass="bg-gradient-to-b from-cyan-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8 pb-16">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-700">Blog y Reportes</h1>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex gap-3">
            <button onClick={() => handleFilter('blog')} className={filterBtnClass('blog')}>📝Entradas del Blog</button>
            <button onClick={() => handleFilter('report')} className={filterBtnClass('report')}>📄 Reportes Oficiales</button>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-[#9B30FF] focus:border-[#9B30FF] outline-none transition"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-20 text-gray-600">Cargando entradas...</p>
        ) : filteredReports.length === 0 ? (
          <p className="text-center py-20 text-gray-600">No hay {activeFilter === 'blog' ? 'blogs' : activeFilter === 'report' ? 'reportes' : 'entradas'} disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredReports.map(report => (<ReportCard key={report.id} report={report} />))}
          </div>
        )}
      </div>
    </Layout>
  );
}