import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

function AdminProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

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
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Mi Perfil">
      <ToastContainer />
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-6">Información de la cuenta</h2>
        <div className="mb-6">
          <p><strong>Usuario:</strong> {user?.username}</p>
          <p><strong>Rol:</strong> {
            user?.role === 'superadmin' ? 'Superadministrador' :
            user?.role === 'campaign_admin' ? 'Administrador de campaña' :
            'Administrador de evento'
          }</p>
          <p><strong>ID:</strong> {user?.id}</p>
        </div>

        <h3 className="text-xl font-semibold mb-4">Cambiar contraseña</h3>
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
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}

export default withAuth(AdminProfile);