import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function PatientSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(2);

  const patientId = location.state?.patientId as string | undefined;
  const patientName = location.state?.patientName as string | undefined;

  useEffect(() => {
    // Redirect if no data provided
    if (!patientId || !patientName) {
      navigate('/patients/new', { replace: true });
      return;
    }

    // Start countdown only if we have valid data
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate('/patients', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [patientId, patientName, navigate]);

  if (!patientId || !patientName) {
    return null;
  }

  const handleViewRecords = () => {
    navigate('/patients');
  };

  const handleClose = () => {
    navigate('/patients');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white shadow-lg border border-gray-200 relative animate-slideUp">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center">
          {/* Hospital Illustration */}
          <div className="mb-8 flex justify-center">
            <svg width="200" height="140" viewBox="0 0 200 140" fill="none">
              {/* Hospital Building */}
              <rect x="40" y="40" width="120" height="90" fill="#3B82F6" />
              <rect x="45" y="45" width="110" height="80" fill="#60A5FA" />

              {/* Cross Symbol */}
              <rect x="85" y="55" width="30" height="10" fill="white" />
              <rect x="95" y="45" width="10" height="30" fill="white" />

              {/* Windows */}
              <rect x="55" y="80" width="15" height="15" fill="#DBEAFE" />
              <rect x="75" y="80" width="15" height="15" fill="#DBEAFE" />
              <rect x="110" y="80" width="15" height="15" fill="#DBEAFE" />
              <rect x="130" y="80" width="15" height="15" fill="#DBEAFE" />

              <rect x="55" y="100" width="15" height="15" fill="#DBEAFE" />
              <rect x="75" y="100" width="15" height="15" fill="#DBEAFE" />
              <rect x="110" y="100" width="15" height="15" fill="#DBEAFE" />
              <rect x="130" y="100" width="15" height="15" fill="#DBEAFE" />

              {/* Door */}
              <rect x="90" y="110" width="20" height="20" fill="#1E40AF" />

              {/* Trees */}
              <circle cx="25" cy="110" r="12" fill="#34D399" />
              <rect x="22" y="110" width="6" height="20" fill="#92400E" />

              <circle cx="175" cy="110" r="12" fill="#34D399" />
              <rect x="172" y="110" width="6" height="20" fill="#92400E" />

              {/* Clouds */}
              <circle cx="30" cy="20" r="8" fill="#E0F2FE" />
              <circle cx="40" cy="20" r="10" fill="#E0F2FE" />
              <circle cx="50" cy="20" r="8" fill="#E0F2FE" />

              <circle cx="150" cy="15" r="8" fill="#E0F2FE" />
              <circle cx="160" cy="15" r="10" fill="#E0F2FE" />
              <circle cx="170" cy="15" r="8" fill="#E0F2FE" />

              {/* Ambulance */}
              <rect x="155" y="125" width="30" height="15" fill="#EF4444" rx="2" />
              <rect x="160" y="120" width="20" height="8" fill="#DC2626" rx="1" />
              <circle cx="163" cy="140" r="3" fill="#1F2937" />
              <circle cx="177" cy="140" r="3" fill="#1F2937" />
              <rect x="168" y="128" width="4" height="4" fill="white" />
              <rect x="170" y="126" width="2" height="8" fill="white" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Congrats! Patient registration is complete.
          </h1>

          <p className="text-gray-600 mb-6">
            {patientName} has been successfully registered with ID{' '}
            <span className="font-semibold text-blue-600">{patientId}</span>
          </p>

          <div className="space-y-3">
            <button
              onClick={handleViewRecords}
              className="w-full px-6 py-3 bg-teal-600 text-white hover:bg-teal-700 transition-colors font-medium"
            >
              View Patient Records
            </button>
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Close ({countdown}s)
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
