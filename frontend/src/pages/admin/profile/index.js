import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { FaEye, FaEyeSlash, FaUser, FaIdCard, FaUserTag, FaBullhorn, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';

function AdminProfile() {
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get('/users/me');
        setUserData(res.data);
      } catch (error) {
        toast.error('Error al cargar los datos de usuario');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const evaluatePassword = (pass) => {
    let score = 0;
    let feedback = '';
    if (pass.length >= 8) score++;
    if (pass.match(/[a-z]/)) score++;
    if (pass.match(/[A-Z]/)) score++;
    if (pass.match(/[0-9]/)) score++;
    if (pass.match(/[^a-zA-Z0-9]/)) score++;

    if (score < 3) feedback = 'Contraseña débil';
    else if (score < 5) feedback = 'Contraseña moderada';
    else feedback = 'Contraseña fuerte';

    setPasswordStrength({ score, feedback });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'newPassword') evaluatePassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordStrength.score < 3) {
      toast.warning('La contraseña es demasiado débil');
      return;
    }
    setSubmitting(true);
    try {
      await api.put('/users/me/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      toast.success('Contraseña actualizada correctamente');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength({ score: 0, feedback: '' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cambiar contraseña';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const roleBadge = {
    superadmin: 'bg-purple-600 text-white',
    campaign_admin: 'bg-orange-500 text-white',
    action_admin: 'bg-yellow-500 text-black',
  };

  const roleName = {
    superadmin: 'Superadministrador',
    campaign_admin: 'Administrador de campaña',
    action_admin: 'Administrador de evento',
  };

  if (loading) {
    return <AdminLayout title="Mi Perfil"><div className="text-center py-8">Cargando perfil...</div></AdminLayout>;
  }

  if (!userData) {
    return <AdminLayout title="Mi Perfil"><div className="text-center py-8 text-red-600">No se pudo cargar el perfil.</div></AdminLayout>;
  }

  return (
    <AdminLayout title="Mi Perfil">
      <ToastContainer />
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <FaUser className="text-fuchsia-600" />
          Mi Perfil
        </h2>

        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded">
          <p className="text-sm text-purple-800">
            Bienvenido/a a la administración de <strong>Voces Palestinas por la Justicia</strong>.
            Agradecemos tu compromiso con la causa y tu colaboración en la gestión de contenidos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
            <FaUser className="text-fuchsia-500 text-xl" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Usuario</p>
              <p className="font-medium text-gray-800">{userData.username}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
            <FaUserTag className="text-fuchsia-500 text-xl" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Rol</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${roleBadge[userData.role] || 'bg-gray-100 text-gray-800'}`}>
                {roleName[userData.role] || userData.role}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
            <FaIdCard className="text-fuchsia-500 text-xl" />
            <div>
              <p className="text-xs text-gray-500 uppercase">ID</p>
              <p className="font-medium text-gray-800">{userData.id}</p>
            </div>
          </div>
        </div>

        {(userData.campaigns?.length > 0 || userData.actions?.length > 0) && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              Asignaciones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userData.campaigns?.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaBullhorn className="text-blue-600" />
                    <span className="font-medium text-blue-800">Campañas asignadas</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {userData.campaigns.map(c => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {userData.actions?.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaCalendarAlt className="text-green-600" />
                    <span className="font-medium text-green-800">Acciones asignadas</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {userData.actions.map(a => (
                      <li key={a.id}>{a.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <hr className="my-6 border-gray-200" />

        <h3 className="text-lg font-semibold text-gray-700 mb-4">Cambiar contraseña</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual *</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent pr-10"
                placeholder="Introduce tu contraseña actual"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showCurrent ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña *</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent pr-10"
                placeholder="Mínimo 8 caracteres, incluye mayúsculas, minúsculas, números y símbolos"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {passwordStrength.feedback && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${passwordStrength.score < 3 ? 'bg-red-500' : passwordStrength.score < 5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${passwordStrength.score < 3 ? 'text-red-600' : passwordStrength.score < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {passwordStrength.feedback}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña *</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent pr-10"
                placeholder="Repite la nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}

export default AdminProfile;