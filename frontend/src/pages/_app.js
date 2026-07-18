import Head from 'next/head';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-calendar/dist/Calendar.css';
import 'react-toastify/dist/ReactToastify.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        {/* Favicon vectorial (usado por la mayoría de navegadores en pestañas) */}
        <link rel="icon" type="image/svg+xml" href="/logo.svg?v=5" />
        {/* PNG de alta resolución para Safari, iOS y como respaldo */}
        <link rel="icon" type="image/png" sizes="512x512" href="/logo-512.png?v=5" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo-512.png?v=5" />
      </Head>
      <Component {...pageProps} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  );
}

export default MyApp;