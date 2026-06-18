import { FaExclamationTriangle } from 'react-icons/fa';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="text-yellow-500 w-6 h-6 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600 mt-2">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Eliminar</button>
        </div>
      </div>
    </div>
  );
}