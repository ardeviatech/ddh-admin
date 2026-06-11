import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { initSocket, getSocket } from "../lib/socket";
import { queueKeys } from "./useQueueQueries";
import { toast } from "sonner";

export const useQueueRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      initSocket();
      const socket = getSocket();

      const onBoard = (board: any) => {
        queryClient.setQueryData(queueKeys.board(), board);
      };

      const onRecalled = (_payload: any) => {
        // ensure board is refreshed and notify
        queryClient.invalidateQueries({ queryKey: queueKeys.board() });
        toast.success("Patient recalled");
      };

      socket.on("queueBoardUpdated", onBoard);
      socket.on("queuePatientRecalled", onRecalled);

      return () => {
        socket.off("queueBoardUpdated", onBoard);
        socket.off("queuePatientRecalled", onRecalled);
      };
    } catch (err) {
      // ignore if socket not available
      console.warn("Queue realtime init failed", err);
    }
  }, [queryClient]);
};

export default useQueueRealtime;
