import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { Header } from '../components/Header';
import { ArrowLeft } from 'lucide-react';

export function SurveyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const response = useAppSelector((state) => state.survey.responses.find((r) => r.id === id));

  if (!response) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Survey Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">The survey response you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/surveys/responses')}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to Responses
            </button>
          </div>
        </div>
      </div>
    );
  }

  const departments = [
    { key: 'laboratory', label: 'Laboratory' },
    { key: 'xray', label: 'X-Ray / ECG' },
    { key: 'pharmacy', label: 'Pharmacy' },
    { key: 'doctor', label: 'Doctor' },
    { key: 'nurse', label: 'Nurse' },
    { key: 'nursingAttendant', label: 'Nursing Attendant' },
    { key: 'utilityWorker', label: 'Utility Worker' },
    { key: 'food', label: 'Food (Pagkain)' },
    { key: 'billing', label: 'Billing / PhilHealth' },
    { key: 'cashier', label: 'Cashier' },
    { key: 'securityGuard', label: 'Security Guard' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Survey Response Detail" subtitle={`Response ID: ${response.id}`} />

      <div className="p-8">
        <button
          onClick={() => navigate('/surveys/responses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Responses
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Response ID</p>
                  <p className="font-semibold text-gray-900">{response.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date Submitted</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(response.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-semibold text-gray-900">{response.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overall Rating</p>
                  <p className="font-semibold text-gray-900 text-lg">{response.overallRating.toFixed(1)}/5.0</p>
                </div>
              </div>
            </div>

            {/* Department Ratings */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Ratings</h3>
              <div className="space-y-4">
                {departments.map((dept) => {
                  const ratings = response.ratings[dept.key as keyof typeof response.ratings];
                  if (!ratings || ratings.length === 0) return null;

                  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                  const deptFeedback = response.feedback?.[dept.key as keyof typeof response.feedback];

                  return (
                    <div key={dept.key} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">{dept.label}</p>
                        <p className="text-sm font-semibold text-gray-900">{average.toFixed(1)}/5.0</p>
                      </div>
                      <div className="w-full bg-gray-200 h-2">
                        <div
                          className="bg-blue-600 h-2"
                          style={{ width: `${(average / 5) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{ratings.length} question(s) answered</p>
                      {deptFeedback && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Feedback:</p>
                          <p className="text-sm text-gray-700">{deptFeedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Rating Scale</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-semibold">1</span> = Kailangang baguhin</div>
                <div><span className="font-semibold">2</span> = Katamtaman</div>
                <div><span className="font-semibold">3</span> = Mahusay</div>
                <div><span className="font-semibold">4</span> = Nakapahusay</div>
                <div><span className="font-semibold">5</span> = Lubos na napakahusay</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
