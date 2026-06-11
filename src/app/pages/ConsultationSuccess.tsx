import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function ConsultationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { consultationId, caseNumber, patientName } = location.state || {};

  useEffect(() => {
    if (!consultationId || !caseNumber) {
      navigate('/fpe', { replace: true });
      return;
    }
  }, [consultationId, caseNumber, navigate]);

  if (!consultationId || !caseNumber) {
    return null;
  }

  const handleViewConsultation = () => {
    navigate(`/fpe/${caseNumber}/consultations/${consultationId}`);
  };

  const handleBackToList = () => {
    navigate(`/fpe/${caseNumber}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white shadow-lg border border-gray-200 relative animate-slideUp">
        <div className="p-8 text-center">
          {/* Medical Consultation Illustration */}
          <div className="mb-8 flex justify-center">
            <svg width="200" height="140" viewBox="0 0 200 140" fill="none">
              {/* Clipboard */}
              <rect x="60" y="20" width="80" height="110" fill="#10B981" rx="4" />
              <rect x="65" y="25" width="70" height="100" fill="#34D399" rx="2" />

              {/* Clip */}
              <rect x="85" y="15" width="30" height="8" fill="#065F46" rx="2" />
              <circle cx="100" cy="19" r="3" fill="#047857" />

              {/* Paper */}
              <rect x="70" y="30" width="60" height="90" fill="white" rx="2" />

              {/* Checkmark in circle */}
              <circle cx="100" cy="55" r="15" fill="#10B981" />
              <path d="M 93 55 L 98 60 L 107 50" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

              {/* Text lines */}
              <rect x="75" y="80" width="50" height="3" fill="#D1FAE5" rx="1" />
              <rect x="75" y="88" width="50" height="3" fill="#D1FAE5" rx="1" />
              <rect x="75" y="96" width="35" height="3" fill="#D1FAE5" rx="1" />

              {/* Badge/Label */}
              <rect x="75" y="105" width="50" height="10" fill="#059669" rx="2" />

              {/* Decorative elements */}
              <circle cx="30" cy="40" r="4" fill="#A7F3D0" opacity="0.6" />
              <circle cx="170" cy="50" r="5" fill="#A7F3D0" opacity="0.6" />
              <circle cx="25" cy="90" r="3" fill="#6EE7B7" opacity="0.6" />
              <circle cx="175" cy="100" r="4" fill="#6EE7B7" opacity="0.6" />

              {/* Stethoscope */}
              <circle cx="45" cy="120" r="6" fill="#10B981" />
              <path d="M 45 114 Q 45 100 60 95" stroke="#10B981" strokeWidth="2" fill="none" />
              <circle cx="60" cy="95" r="3" fill="#059669" />

              {/* Medical Cross */}
              <rect x="152" y="118" width="8" height="2" fill="#10B981" />
              <rect x="154" y="116" width="2" height="8" fill="#10B981" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Consultation Completed Successfully!
          </h1>

          <p className="text-gray-600 mb-2">
            Consultation has been recorded for{' '}
            <span className="font-semibold text-green-600">{patientName}</span>
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Consultation ID: <span className="font-semibold text-gray-900">{consultationId}</span>
          </p>

          <div className="bg-green-50 border border-green-200 p-3 mb-6 text-left">
            <p className="text-xs text-green-800">
              <span className="font-semibold">Saved Successfully</span> • The consultation record has been added to the patient's medical history.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleViewConsultation}
              className="w-full px-6 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
            >
              View Consultation Details
            </button>
            <button
              onClick={handleBackToList}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Back to First Patient Encounter
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
