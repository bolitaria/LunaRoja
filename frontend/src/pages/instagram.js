import Layout from '../components/Layout';
import InstagramFeed from '../components/InstagramFeed';

export default function InstagramPage() {
  return (
    <Layout title="Instagram - LunaRoja">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Instagram</h1>
        <p className="text-center text-gray-600 mb-8">
          Últimas publicaciones de nuestras cuentas oficiales.
        </p>
        <InstagramFeed limit={30} />
      </div>
    </Layout>
  );
}