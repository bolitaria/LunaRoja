import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ReportCard from '../components/ReportCard';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`);
        setReports(res.data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <Layout title="Reportes - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 py-8 pb-16">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">Reportes y documentos</h1>
        {loading ? <p className="text-center text-gray-600">Cargando reportes...</p> : reports.length === 0 ? <p className="text-center text-gray-600">No hay reportes disponibles.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reports.map(report => <ReportCard key={report.id} report={report} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}