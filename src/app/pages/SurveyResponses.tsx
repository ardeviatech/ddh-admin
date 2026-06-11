import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { Header } from "../components/Header";
import { ArrowLeft, Eye, Search } from "lucide-react";
import { type SurveyResponse } from "../../store/slices/surveySlice";

export function SurveyResponses() {
  const navigate = useNavigate();
  const responses = useAppSelector(
    (state): SurveyResponse[] => state.survey.responses,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterSentiment, setFilterSentiment] = useState("all");

  // Get unique departments
  const departments = useMemo(() => {
    const depts = responses
      .map((r) => r.department)
      .filter((dept, index, self) => self.indexOf(dept) === index);
    return ["all", ...depts];
  }, [responses]);

  // Filter responses
  const filteredResponses = useMemo(() => {
    return responses.filter((response) => {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        response.id.toLowerCase().includes(lowerQuery) ||
        response.department.toLowerCase().includes(lowerQuery);

      const matchesDepartment =
        filterDepartment === "all" || response.department === filterDepartment;
      const matchesSentiment =
        filterSentiment === "all" || response.sentiment === filterSentiment;

      return matchesSearch && matchesDepartment && matchesSentiment;
    });
  }, [responses, searchQuery, filterDepartment, filterSentiment]);

  const getSentimentColor = (
    sentiment: SurveyResponse["sentiment"] | string,
  ) => {
    switch (sentiment) {
      case "Positive":
        return "bg-green-100 text-green-800 border border-green-300";
      case "Negative":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Survey Responses"
        subtitle="View and manage patient survey responses"
      />

      <div className="p-8">
        <button
          onClick={() => navigate("/surveys")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Survey Dashboard
        </button>

        <div className="bg-white border border-gray-200">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search by ID or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Department Filter */}
              <div>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === "all" ? "All Departments" : dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sentiment Filter */}
              <div>
                <select
                  value={filterSentiment}
                  onChange={(e) => setFilterSentiment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Sentiments</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr className="border-b-2 border-gray-300">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Response ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Overall Rating
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Sentiment
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      No survey responses found
                    </td>
                  </tr>
                ) : (
                  filteredResponses.map((response, index) => (
                    <tr
                      key={response.id}
                      className={`border-b border-gray-200 hover:bg-blue-100 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-100"
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {response.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(response.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {response.department}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {response.overallRating.toFixed(1)}/5.0
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold ${getSentimentColor(response.sentiment)}`}
                        >
                          {response.sentiment}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            navigate(`/surveys/responses/${response.id}`)
                          }
                          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {filteredResponses.length} of {responses.length} responses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
