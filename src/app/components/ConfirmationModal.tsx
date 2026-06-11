import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  type?: 'danger' | 'success';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  type = 'danger',
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-6 bg-cover bg-center"
      style={{
        backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDDH%20Yakap%2FCheck%20this.jpg?alt=media&token=fc787d13-8674-4386-8b1f-f517af49e433')`
      }}
    >
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="bg-white w-full max-w-md p-6 relative z-10 shadow-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-2 ${isDanger ? 'bg-red-50' : 'bg-green-50'}`}>
            {isDanger ? (
              <AlertTriangle className="text-red-600" size={24} />
            ) : (
              <CheckCircle className="text-green-600" size={24} />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-2.5 text-white text-sm font-medium transition-colors ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
