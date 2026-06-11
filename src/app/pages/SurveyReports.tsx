import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { Header } from "../components/Header";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { type SurveyResponse } from "../../store/slices/surveySlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function SurveyReports() {
  const navigate = useNavigate();
  const responses = useAppSelector(
    (state) => state.survey.responses,
  ) as SurveyResponse[];

  const departments = [
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

  // Department average ratings data
  const departmentData = useMemo(() => {
    const data = departments
      .map((dept) => {
        const allRatings: number[] = [];
        responses.forEach((response: { ratings: { [x: string]: any } }) => {
          const ratings =
            response.ratings[dept.key as keyof typeof response.ratings];
          if (ratings && ratings.length > 0) {
            allRatings.push(...ratings);
          }
        });

        const average =
          allRatings.length > 0
            ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
            : 0;

        return {
          id: dept.key,
          name: dept.label,
          rating: parseFloat(average.toFixed(2)),
        };
      })
      .sort((a, b) => b.rating - a.rating);

    // Add index to ensure uniqueness after sorting
    return data.map((item, index) => ({
      ...item,
      uniqueId: `dept-${index}-${item.id}`,
    }));
  }, [responses]);

  // Sentiment distribution data
  const sentimentData = useMemo(() => {
    const positive = responses.filter(
      (r: { sentiment: string }) => r.sentiment === "Positive",
    ).length;
    const neutral = responses.filter(
      (r: { sentiment: string }) => r.sentiment === "Neutral",
    ).length;
    const negative = responses.filter(
      (r: { sentiment: string }) => r.sentiment === "Negative",
    ).length;

    return [
      { id: "positive", name: "Positive", value: positive, color: "#10b981" },
      { id: "neutral", name: "Neutral", value: neutral, color: "#6b7280" },
      { id: "negative", name: "Negative", value: negative, color: "#ef4444" },
    ];
  }, [responses]);

  // Rating distribution data
  const ratingDistribution = useMemo(() => {
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    responses.forEach((response) => {
      const ratingValues = Object.values(response.ratings) as Array<
        number[] | undefined
      >;
      ratingValues.forEach((ratings) => {
        if (Array.isArray(ratings)) {
          ratings.forEach((rating) => {
            const numericRating = Number(rating);
            if (
              Number.isInteger(numericRating) &&
              numericRating >= 1 &&
              numericRating <= 5
            ) {
              distribution[numericRating] += 1;
            }
          });
        }
      });
    });

    return [
      { id: "rating-1", rating: "1 Star", count: distribution[1] },
      { id: "rating-2", rating: "2 Stars", count: distribution[2] },
      { id: "rating-3", rating: "3 Stars", count: distribution[3] },
      { id: "rating-4", rating: "4 Stars", count: distribution[4] },
      { id: "rating-5", rating: "5 Stars", count: distribution[5] },
    ];
  }, [responses]);

  // Response trend over time
  const responseTrend = useMemo(() => {
    const sortedResponses = [...responses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const trendData: Record<
      string,
      {
        id: string;
        date: string;
        responses: number;
        avgRating: number;
        timestamp: number;
      }
    > = {};

    sortedResponses.forEach((response) => {
      const responseDate = new Date(response.date);
      const dateKey = responseDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!trendData[dateKey]) {
        trendData[dateKey] = {
          id: dateKey,
          date: dateKey,
          responses: 0,
          avgRating: 0,
          timestamp: responseDate.getTime(),
        };
      }

      trendData[dateKey].responses += 1;
      trendData[dateKey].avgRating += response.overallRating;
    });

    return Object.values(trendData)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((item, index) => ({
        ...item,
        uniqueId: `trend-${index}-${item.timestamp}`,
        avgRating: parseFloat((item.avgRating / item.responses).toFixed(2)),
      }));
  }, [responses]);

  const handleExport = () => {
    const data = {
      generatedDate: new Date().toISOString(),
      totalResponses: responses.length,
      departmentRatings: departmentData,
      sentimentDistribution: sentimentData,
      ratingDistribution: ratingDistribution,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Reports & Analytics"
        subtitle="Visual insights and data analysis"
      />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/surveys")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Survey Dashboard
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Export Data
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Printer size={16} />
              Print Report
            </button>
          </div>
        </div>

        {/* Department Performance Chart */}
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Department Average Ratings
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={120}
                tick={{ fontSize: 12 }}
              />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                }}
                formatter={(value: any) => {
                  const numericValue =
                    typeof value === "number" ? value : Number(value);
                  return [
                    Number.isFinite(numericValue)
                      ? numericValue.toFixed(2)
                      : String(value),
                    "Rating",
                  ];
                }}
              />
              <Legend />
              <Bar dataKey="rating" fill="#2563eb" name="Average Rating">
                {departmentData.map((entry) => (
                  <Cell key={entry.uniqueId} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sentiment Distribution */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sentiment Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rating Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="count" fill="#10b981" name="Count">
                  {ratingDistribution.map((entry) => (
                    <Cell key={entry.id} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response Trend */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Response Trend Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 5]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="responses"
                stroke="#2563eb"
                strokeWidth={2}
                name="# of Responses"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgRating"
                stroke="#10b981"
                strokeWidth={2}
                name="Avg Rating"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        <div className="bg-white border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Summary Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Responses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {responses.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(
                  responses.reduce((sum, r) => sum + r.overallRating, 0) /
                  responses.length
                ).toFixed(1)}
                /5.0
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Positive Feedback</p>
              <p className="text-2xl font-semibold text-green-600">
                {((sentimentData[0].value / responses.length) * 100).toFixed(0)}
                %
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Response Rate</p>
              <p className="text-2xl font-semibold text-blue-600">
                {responses.filter((r) => r.feedback).length} with feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
