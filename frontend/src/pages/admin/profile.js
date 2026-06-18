import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { FaEye, FaEyeSlash, FaUser, FaIdCard, FaUserTag } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

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
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/me/password`, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
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

  // Colores de rol (coinciden con AdminLayout)
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
    return (
      <AdminLayout title="Mi Perfil">
        <div className="text-center py-8">Cargando perfil...</div>
      </AdminLayout>
    );
  }

  if (!userData) {
    return (
      <AdminLayout title="Mi Perfil">
        <div className="text-center py-8 text-red-600">No se pudo cargar el perfil.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Mi Perfil">
      <ToastContainer />
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <FaUser className="text-gray-500" /> Mi Perfil
        </h2>

        {/* Mensaje de bienvenida */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded">
          <p className="text-sm text-purple-800">
            Bienvenido/a a la administración de <strong>Voces Palestinas por la Justicia</strong>. 
            Agradecemos tu compromiso con la causa y tu colaboración en la gestión de contenidos.
          </p>
        </div>

        {/* Información del usuario en tarjeta atractiva */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
            <FaUser className="text-gray-400 text-xl" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Usuario</p>
              <p className="font-medium text-gray-800">{userData.username}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
            <FaUserTag className="text-gray-400 text-xl" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Rol</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${roleBadge[userData.role] || 'bg-gray-100 text-gray-800'}`}>
                {roleName[userData.role] || userData.role}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
            <FaIdCard className="text-gray-400 text-xl" />
            <div>
              <p className="text-xs text-gray-500 uppercase">ID</p>
              <p className="font-medium text-gray-800">{userData.id}</p>
            </div>
          </div>
        </div>

        {/* Campañas y eventos asignados */}
        {(userData.role === 'campaign_admin' || userData.role === 'superadmin') && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span>📁</span> Campañas asignadas:
            </p>
            {userData.campaigns && userData.campaigns.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                {userData.campaigns.map(camp => (
                  <li key={camp.id}>{camp.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 mt-1">No tiene campañas asignadas.</p>
            )}
          </div>
        )}

        {(userData.role === 'action_admin' || userData.role === 'superadmin') && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span>📌</span> Eventos asignados:
            </p>
            {userData.actions && userData.actions.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                {userData.actions.map(act => (
                  <li key={act.id}>{act.title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 mt-1">No tiene eventos asignados.</p>
            )}
          </div>
        )}

        <hr className="my-4" />

        <h3 className="text-lg font-medium mb-3">Cambiar contraseña</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña actual</label>
            <div className="relative mt-1">
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
              >
                {showCurrent ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nueva contraseña</label>
            <div className="relative mt-1">
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {form.newPassword && (
              <div className="mt-2">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        passwordStrength.score < 3 ? 'bg-red-500' :
                        passwordStrength.score < 5 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{passwordStrength.feedback}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar nueva contraseña</label>
            <div className="relative mt-1">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}

export default withAuth(AdminProfile);