import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { Header } from "../components/Header";
import {
  ClipboardList,
  TrendingUp,
  Trophy,
  AlertTriangle,
  Users,
  FileText,
} from "lucide-react";
import { useMemo } from "react";
import { type SurveyResponse } from "../../store/slices/surveySlice";

export function SurveyDashboard() {
  const navigate = useNavigate();
  const responses = useAppSelector(
    (state) => state.survey.responses,
  ) as SurveyResponse[];

  // Calculate statistics
  const stats = useMemo(() => {
    const totalResponses = responses.length;
    const averageSatisfaction =
      responses.reduce((sum, r) => sum + r.overallRating, 0) / totalResponses ||
      0;

    // Count responses by department
    const departmentRatings = responses.reduce<Record<string, number[]>>(
      (acc, response) => {
        if (!acc[response.department]) {
          acc[response.department] = [];
        }
        acc[response.department].push(response.overallRating);
        return acc;
      },
      {},
    );

    // Calculate average per department
    const departmentAverages = Object.keys(departmentRatings).map((dept) => {
      const ratings = departmentRatings[dept];
      return {
        department: dept,
        average:
          ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
      };
    });

    const highestRated = departmentAverages.sort(
      (a, b) => b.average - a.average,
    )[0];
    const lowestRated = departmentAverages.sort(
      (a, b) => a.average - b.average,
    )[0];

    // Today's responses (within last 24 hours)
    const today = new Date();
    const todayResponses = responses.filter(
      (r: { date: string | number | Date }) => {
        const responseDate = new Date(r.date);
        const diffTime = Math.abs(today.getTime() - responseDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 1;
      },
    ).length;

    const responsesWithFeedback = responses.filter((r) => {
      if (!r.feedback) return false;
      return Object.values(r.feedback).some(
        (text): text is string =>
          typeof text === "string" && text.trim() !== "",
      );
    }).length;

    return {
      totalResponses,
      averageSatisfaction: averageSatisfaction.toFixed(1),
      highestRated: highestRated?.department || "N/A",
      highestRating: highestRated?.average.toFixed(1) || "0",
      lowestRated: lowestRated?.department || "N/A",
      lowestRating: lowestRated?.average.toFixed(1) || "0",
      todayResponses,
      responsesWithFeedback,
    };
  }, [responses]);

  const statCards = [
    {
      title: "Total Responses",
      value: stats.totalResponses.toString(),
      icon: ClipboardList,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Average Satisfaction",
      value: `${stats.averageSatisfaction}/5.0`,
      icon: TrendingUp,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Highest Rated Department",
      value: stats.highestRated,
      icon: Trophy,
      color: "bg-yellow-50 text-yellow-600",
      subtitle: `Rating: ${stats.highestRating}`,
    },
    {
      title: "Lowest Rated Department",
      value: stats.lowestRated,
      icon: AlertTriangle,
      color: "bg-red-50 text-red-600",
      subtitle: `Rating: ${stats.lowestRating}`,
    },
    {
      title: "Today's Responses",
      value: stats.todayResponses.toString(),
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Responses with Feedback",
      value: stats.responsesWithFeedback.toString(),
      icon: FileText,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  // Get recent survey activities
  interface RecentActivity {
    id: string;
    text: string;
    subtext: string;
    status: SurveyResponse["sentiment"];
  }

  const recentActivities = useMemo<RecentActivity[]>(() => {
    return responses.slice(0, 4).map((response) => ({
      id: response.id,
      text: `New survey submitted - ${response.department}`,
      subtext: `Rating: ${response.overallRating.toFixed(1)} • ${new Date(
        response.date,
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      status: response.sentiment,
    }));
  }, [responses]);

  // Get survey alerts
  const alerts = useMemo(() => {
    const lowRatingDepts = responses
      .filter((r) => r.overallRating < 3.0)
      .map((r) => r.department)
      .filter((dept, index, self) => self.indexOf(dept) === index);

    const highRatingDepts = responses
      .filter((r) => r.overallRating >= 4.5)
      .map((r) => r.department)
      .filter((dept, index, self) => self.indexOf(dept) === index);

    const alertList: { type: "warning" | "success"; message: string }[] = [];

    lowRatingDepts.forEach((dept: any) => {
      alertList.push({
        type: "warning",
        message: `${dept} rating dropped below 3.0`,
      });
    });

    highRatingDepts.slice(0, 1).forEach((dept: any) => {
      alertList.push({
        type: "success",
        message: `High satisfaction score achieved in ${dept} department`,
      });
    });

    const negativeCount = responses.filter(
      (r: { sentiment: string }) => r.sentiment === "Negative",
    ).length;
    if (negativeCount > 2) {
      alertList.push({
        type: "warning",
        message: `${negativeCount} negative feedback responses require attention`,
      });
    }

    return alertList;
  }, [responses]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Patient Surveys"
        subtitle="Monitor patient satisfaction and feedback"
      />

      <div className="p-4 md:p-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className="bg-white border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs mt-1 text-gray-600">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={`p-3 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Recent Survey Activity */}
          <div className="bg-white border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Survey Activity
            </h3>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No recent activities
                </p>
              ) : (
                recentActivities.map((activity) => {
                  const color =
                    activity.status === "Positive"
                      ? "bg-green-600"
                      : activity.status === "Negative"
                        ? "bg-red-600"
                        : "bg-gray-600";

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0"
                    >
                      <div className={`w-2 h-2 ${color} mt-2`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.subtext}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/surveys/responses")}
                className="w-full px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-left"
              >
                View Responses
              </button>
              <button
                onClick={() => navigate("/surveys/feedback")}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                Review Feedback
              </button>
              <button
                onClick={() => navigate("/surveys/department-performance")}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                Department Performance
              </button>
              <button
                onClick={() => navigate("/surveys/reports")}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-left flex items-center gap-2"
              >
                <FileText size={16} />
                Generate Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Survey Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white border border-orange-300 p-4 md:p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={24} className="text-orange-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Survey Alerts
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {alerts.length} alert{alerts.length !== 1 ? "s" : ""} require
                  {alerts.length === 1 ? "s" : ""} attention
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 ${
                    alert.type === "warning"
                      ? "bg-orange-50 border border-orange-200"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {alert.message}
                  </p>
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold ${
                      alert.type === "warning"
                        ? "bg-orange-100 text-orange-800 border border-orange-300"
                        : "bg-green-100 text-green-800 border border-green-300"
                    }`}
                  >
                    {alert.type === "warning" ? "Action Needed" : "Good News"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
