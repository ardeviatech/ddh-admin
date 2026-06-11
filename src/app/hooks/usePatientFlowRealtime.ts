import { useEffect } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { patientFlowKeys } from "../../services/usePatientFlowQueries";
import { patientFlowDocumentKeys } from "../../services/usePatientFlowDocumentQueries";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const usePatientFlowRealtime = (metricId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    const invalidateMetrics = () => {
      queryClient.invalidateQueries({
        queryKey: patientFlowKeys.all,
        exact: false,
      });
    };

    const invalidateMetricDetail = () => {
      if (metricId) {
        queryClient.invalidateQueries({
          queryKey: patientFlowKeys.detail(metricId),
        });
      }
    };

    const invalidateDocuments = (changedMetricId: string) => {
      queryClient.invalidateQueries({
        queryKey: patientFlowDocumentKeys.list(changedMetricId),
      });
      if (metricId && changedMetricId === metricId) {
        invalidateMetricDetail();
      }
    };

    socket.on("patientFlowMetricCreated", invalidateMetrics);
    socket.on("patientFlowMetricUpdated", invalidateMetrics);
    socket.on("patientFlowMetricDeleted", invalidateMetrics);
    socket.on(
      "patientFlowDocumentUploaded",
      (payload: { metricId: string }) => {
        invalidateDocuments(payload.metricId);
      },
    );
    socket.on("patientFlowDocumentDeleted", (payload: { metricId: string }) => {
      invalidateDocuments(payload.metricId);
    });

    return () => {
      socket.off("patientFlowMetricCreated", invalidateMetrics);
      socket.off("patientFlowMetricUpdated", invalidateMetrics);
      socket.off("patientFlowMetricDeleted", invalidateMetrics);
      socket.off("patientFlowDocumentUploaded");
      socket.off("patientFlowDocumentDeleted");
      socket.disconnect();
    };
  }, [metricId, queryClient]);
};
