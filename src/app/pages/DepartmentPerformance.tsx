import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { Header } from "../components/Header";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function DepartmentPerformance() {
  const navigate = useNavigate();
  const responses = useAppSelector((state) => state.survey.responses);

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

  const departmentStats = useMemo(() => {
    return departments.map((dept) => {
      const allRatings: number[] = [];
      responses.forEach((response: { ratings: { [x: string]: any } }) => {
        const ratings =
          response.ratings[dept.key as keyof typeof response.ratings];
        if (ratings && ratings.length > 0) {
          allRatings.push(...ratings);
        }
      });

      if (allRatings.length === 0) {
        return {
          ...dept,
          average: 0,
          totalResponses: 0,
          totalRatings: 0,
          trend: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      const average =
        allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
      const distribution = allRatings.reduce(
        (acc, rating) => {
          acc[rating] = (acc[rating] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

      // Calculate trend (compare recent half vs older half)
      const midpoint = Math.floor(allRatings.length / 2);
      const recentAvg =
        allRatings.slice(0, midpoint).reduce((sum, r) => sum + r, 0) /
          midpoint || 0;
      const olderAvg =
        allRatings.slice(midpoint).reduce((sum, r) => sum + r, 0) /
          (allRatings.length - midpoint) || 0;
      const trend = recentAvg - olderAvg;

      return {
        ...dept,
        average,
        totalResponses: responses.filter(
          (r: { ratings: { [x: string]: string | any[] } }) =>
            r.ratings[dept.key as keyof typeof r.ratings]?.length > 0,
        ).length,
        totalRatings: allRatings.length,
        trend,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...distribution },
      };
    });
  }, [responses]);

  const sortedDepartments = [...departmentStats].sort(
    (a, b) => b.average - a.average,
  );

  const getTrendIcon = (trend: number) => {
    if (trend > 0.2) return <TrendingUp size={20} className="text-green-600" />;
    if (trend < -0.2)
      return <TrendingDown size={20} className="text-red-600" />;
    return <Minus size={20} className="text-gray-600" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0.2) return "text-green-600";
    if (trend < -0.2) return "text-red-600";
    return "text-gray-600";
  };

  const getPerformanceColor = (average: number) => {
    if (average >= 4.5)
      return "bg-green-100 text-green-800 border border-green-300";
    if (average >= 4.0)
      return "bg-blue-100 text-blue-800 border border-blue-300";
    if (average >= 3.0)
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    return "bg-red-100 text-red-800 border border-red-300";
  };

  const getPerformanceLabel = (average: number) => {
    if (average >= 4.5) return "Excellent";
    if (average >= 4.0) return "Good";
    if (average >= 3.0) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Department Performance"
        subtitle="Detailed performance metrics by department"
      />

      <div className="p-8">
        <button
          onClick={() => navigate("/surveys")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Survey Dashboard
        </button>

        {/* Performance Overview */}
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Top Performer</p>
              <p className="text-xl font-semibold text-gray-900">
                {sortedDepartments[0]?.label || "N/A"}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Rating: {sortedDepartments[0]?.average.toFixed(1) || "0.0"}/5.0
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Most Improved</p>
              <p className="text-xl font-semibold text-gray-900">
                {[...departmentStats].sort((a, b) => b.trend - a.trend)[0]
                  ?.label || "N/A"}
              </p>
              <p className="text-sm text-green-600 mt-1">
                +{Math.max(...departmentStats.map((d) => d.trend)).toFixed(1)}{" "}
                improvement
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Needs Attention</p>
              <p className="text-xl font-semibold text-gray-900">
                {sortedDepartments[sortedDepartments.length - 1]?.label ||
                  "N/A"}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Rating:{" "}
                {sortedDepartments[
                  sortedDepartments.length - 1
                ]?.average.toFixed(1) || "0.0"}
                /5.0
              </p>
            </div>
          </div>
        </div>

        {/* Department Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedDepartments.map((dept) => (
            <div key={dept.key} className="bg-white border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {dept.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {dept.totalResponses} response
                    {dept.totalResponses !== 1 ? "s" : ""} • {dept.totalRatings}{" "}
                    rating{dept.totalRatings !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(dept.trend)}
                  <span
                    className={`text-sm font-semibold ${getTrendColor(dept.trend)}`}
                  >
                    {dept.trend > 0 ? "+" : ""}
                    {dept.trend.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl font-semibold text-gray-900">
                  {dept.average.toFixed(1)}
                </div>
                <div className="flex-1">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold ${getPerformanceColor(dept.average)}`}
                  >
                    {getPerformanceLabel(dept.average)}
                  </span>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Rating Distribution
                </p>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count =
                    dept.distribution[rating as 1 | 2 | 3 | 4 | 5] || 0;
                  const percentage =
                    dept.totalRatings > 0
                      ? (count / dept.totalRatings) * 100
                      : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-8">
                        {rating} ⭐
                      </span>
                      <div className="flex-1 bg-gray-200 h-2">
                        <div
                          className="bg-blue-600 h-2"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
