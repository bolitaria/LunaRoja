import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import { FaEye, FaEyeSlash, FaUser, FaIdCard, FaUserTag, FaBullhorn, FaCalendarAlt, FaCheckCircle, FaEnvelope, FaClock } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';

function AdminProfile() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();
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
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!authUser) return;

    const fetchUserData = async () => {
      try {
        const res = await api.get('/users/me');
        setUserData(res.data);
      } catch (error) {
        console.error('Error al cargar /users/me:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          toast.error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
          logout();
          router.push('/admin/login');
        } else {
          toast.error('Error al cargar los datos del perfil');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser, logout, router]);

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

  const handleRecoverPassword = async () => {
    if (!userData?.email) {
      toast.error('No se encontró una dirección de correo electrónico asociada a tu cuenta.');
      return;
    }
    setRecovering(true);
    try {
      await api.post('/auth/forgot-password', { email: userData.email });
      toast.success('Se ha enviado un enlace de recuperación a tu correo electrónico.');
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al enviar el correo de recuperación';
      toast.error(msg);
    } finally {
      setRecovering(false);
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
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Tarjeta de información del perfil */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <FaUser className="text-purple-600" />
            Información del perfil
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-amber-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
              <FaUser className="text-purple-500 text-xl" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Usuario</p>
                <p className="font-medium text-gray-800">{userData.username}</p>
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
              <FaUserTag className="text-purple-500 text-xl" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Rol</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${roleBadge[userData.role] || 'bg-gray-100 text-gray-800'}`}>
                  {roleName[userData.role] || userData.role}
                </span>
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
              <FaIdCard className="text-purple-500 text-xl" />
              <div>
                <p className="text-xs text-gray-500 uppercase">ID</p>
                <p className="font-medium text-gray-800">{userData.id}</p>
              </div>
            </div>
            {userData.email && (
              <div className="bg-amber-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
                <FaEnvelope className="text-purple-500 text-xl" />
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email</p>
                  <p className="font-medium text-gray-800 truncate">{userData.email}</p>
                </div>
              </div>
            )}
            {userData.lastLogin && (
              <div className="bg-amber-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
                <FaClock className="text-purple-500 text-xl" />
                <div>
                  <p className="text-xs text-gray-500 uppercase">Último acceso</p>
                  <p className="font-medium text-gray-800">{new Date(userData.lastLogin).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Asignaciones */}
          {(userData.campaigns?.length > 0 || userData.actions?.length > 0) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaCheckCircle className="text-emerald-500" />
                Asignaciones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userData.campaigns?.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaBullhorn className="text-purple-600" />
                      <span className="font-medium text-purple-800">Campañas asignadas</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {userData.campaigns.map(c => (
                        <li key={c.id}>{c.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {userData.actions?.length > 0 && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCalendarAlt className="text-emerald-600" />
                      <span className="font-medium text-emerald-800">Acciones asignadas</span>
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
        </div>

        {/* Tarjeta de cambio de contraseña */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Cambiar contraseña</h3>
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
                  className="input-field pr-10"
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
                  className="input-field pr-10"
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
                        className={`h-full transition-all ${passwordStrength.score < 3 ? 'bg-red-500' : passwordStrength.score < 5 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.score < 3 ? 'text-red-600' : passwordStrength.score < 5 ? 'text-yellow-600' : 'text-emerald-600'}`}>
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
                  className="input-field pr-10"
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
              className="btn-primary w-full"
            >
              {submitting ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>

        {/* Tarjeta de recuperación de contraseña */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Recuperación de contraseña</h3>
          <p className="text-sm text-gray-600 mb-4">
            Si olvidaste tu contraseña, puedes solicitar un enlace de recuperación que se enviará a tu correo electrónico.
          </p>
          <button
            onClick={handleRecoverPassword}
            disabled={recovering}
            className="btn-secondary w-full"
          >
            {recovering ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminProfile;