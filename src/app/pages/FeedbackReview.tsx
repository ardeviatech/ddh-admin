import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { Header } from "../components/Header";
import { ArrowLeft, MessageSquare, Search, Eye } from "lucide-react";

type FeedbackTextMap = Record<string, string | null | undefined>;

type SurveyResponse = {
  id: string;
  sentiment: string;
  department: string;
  overallRating: number;
  feedback?: FeedbackTextMap;
  date: string | number | Date;
};

export function FeedbackReview() {
  const navigate = useNavigate();
  const responses = useAppSelector(
    (state) => state.survey.responses as SurveyResponse[],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  const departmentsList = [
    { key: "laboratory", label: "Laboratory" },
    { key: "xray", label: "X-Ray / ECG" },
    { key: "pharmacy", label: "Pharmacy" },
    { key: "doctor", label: "Doctor" },
    { key: "nurse", label: "Nurse" },
    { key: "nursingAttendant", label: "Nursing Attendant" },
    { key: "utilityWorker", label: "Utility Worker" },
    { key: "food", label: "Food (Pagkain)" },
    { key: "billing", label: "Billing / PhilHealth" },
    { key: "cashier", label: "Cashier" },
    { key: "securityGuard", label: "Security Guard" },
  ];

  // Get unique departments
  const departments = useMemo(() => {
    const depts = responses
      .map((r: { department: any }) => r.department)
      .filter(
        (dept: any, index: any, self: string | any[]) =>
          self.indexOf(dept) === index,
      );
    return ["all", ...depts];
  }, [responses]);

  // Get responses with feedback
  const feedbackResponses = useMemo(() => {
    return responses.filter((r) => {
      if (!r.feedback) return false;
      const feedbackValues = Object.values(r.feedback) as Array<
        string | null | undefined
      >;
      return feedbackValues.some(
        (text) => typeof text === "string" && text.trim() !== "",
      );
    });
  }, [responses]);

  // Filter feedback
  const filteredFeedback = useMemo(() => {
    return feedbackResponses.filter((response: SurveyResponse) => {
      const feedbackTexts = response.feedback
        ? Object.values(response.feedback)
            .filter((text): text is string => typeof text === "string")
            .join(" ")
            .toLowerCase()
        : "";

      const matchesSearch =
        searchQuery === "" ||
        feedbackTexts.includes(searchQuery.toLowerCase()) ||
        response.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        response.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSentiment =
        filterSentiment === "all" || response.sentiment === filterSentiment;
      const matchesDepartment =
        filterDepartment === "all" || response.department === filterDepartment;

      return matchesSearch && matchesSentiment && matchesDepartment;
    });
  }, [feedbackResponses, searchQuery, filterSentiment, filterDepartment]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return "bg-green-100 text-green-800 border border-green-300";
      case "Negative":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  const getSentimentBorder = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return "border-l-4 border-l-green-600";
      case "Negative":
        return "border-l-4 border-l-red-600";
      default:
        return "border-l-4 border-l-gray-600";
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const totalWithFeedback = feedbackResponses.length;
    const positiveCount = feedbackResponses.filter(
      (r: { sentiment: string }) => r.sentiment === "Positive",
    ).length;
    const negativeCount = feedbackResponses.filter(
      (r: { sentiment: string }) => r.sentiment === "Negative",
    ).length;
    const neutralCount = feedbackResponses.filter(
      (r: { sentiment: string }) => r.sentiment === "Neutral",
    ).length;

    return {
      totalWithFeedback,
      positiveCount,
      negativeCount,
      neutralCount,
    };
  }, [feedbackResponses]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Feedback Review"
        subtitle="Patient comments and feedback analysis"
      />

      <div className="p-8">
        <button
          onClick={() => navigate("/surveys")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Survey Dashboard
        </button>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Feedback</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {stats.totalWithFeedback}
                </p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600">
                <MessageSquare size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Positive</p>
            <p className="text-3xl font-semibold text-green-600">
              {stats.positiveCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalWithFeedback > 0
                ? (
                    (stats.positiveCount / stats.totalWithFeedback) *
                    100
                  ).toFixed(0)
                : 0}
              %
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Negative</p>
            <p className="text-3xl font-semibold text-red-600">
              {stats.negativeCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalWithFeedback > 0
                ? (
                    (stats.negativeCount / stats.totalWithFeedback) *
                    100
                  ).toFixed(0)
                : 0}
              %
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Neutral</p>
            <p className="text-3xl font-semibold text-gray-600">
              {stats.neutralCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalWithFeedback > 0
                ? (
                    (stats.neutralCount / stats.totalWithFeedback) *
                    100
                  ).toFixed(0)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

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
          </div>
        </div>

        {/* Feedback Cards */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredFeedback.length} of {feedbackResponses.length}{" "}
              responses with feedback
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredFeedback.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No feedback found
              </div>
            ) : (
              filteredFeedback.map((response: SurveyResponse) => (
                <div
                  key={response.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${getSentimentBorder(response.sentiment)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold ${getSentimentColor(response.sentiment)}`}
                      >
                        {response.sentiment}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {response.department}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {response.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Rating</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {response.overallRating.toFixed(1)}/5.0
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/surveys/responses/${response.id}`)
                        }
                        className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm flex items-center gap-1"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </div>
                  </div>

                  {/* All feedbacks from this response */}
                  <div className="space-y-3 mb-3">
                    {response.feedback &&
                      Object.entries(response.feedback).map(
                        ([deptKey, feedbackText]) => {
                          if (
                            typeof feedbackText !== "string" ||
                            feedbackText.trim() === ""
                          )
                            return null;
                          const deptLabel =
                            departmentsList.find((d) => d.key === deptKey)
                              ?.label || deptKey;

                          return (
                            <div
                              key={deptKey}
                              className="bg-blue-50 border border-blue-200 p-3"
                            >
                              <p className="text-xs font-semibold text-blue-900 mb-1">
                                {deptLabel}:
                              </p>
                              <p className="text-sm text-gray-700">
                                {feedbackText}
                              </p>
                            </div>
                          );
                        },
                      )}
                  </div>

                  <p className="text-xs text-gray-500">
                    {new Date(response.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
