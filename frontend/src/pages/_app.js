import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import 'react-calendar/dist/Calendar.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;