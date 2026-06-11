import axiosInstance from "../api/axiosInstance";

export interface QueueEntry {
  id: string;
  queueNumber: string;
  fullName: string;
  department: string;
  departmentName?: string;
  departmentShortName?: string;
  status: "waiting" | "serving" | "completed";
  notes?: string;
  registeredBy?: {
    id?: string;
    name?: string;
    email?: string;
    username?: string;
  };
  createdAt?: string;
  timeAdded?: string;
  calledAt?: string;
  completedAt?: string;
}

export interface DepartmentBoard {
  id: string;
  name: string;
  shortName: string;
  prefix?: string;
  nowServing: QueueEntry | null;
  waitingList: QueueEntry[];
}

export interface QueueBoardResponse {
  departments: DepartmentBoard[];
  updatedAt: string;
}

export const fetchQueueBoard = async (): Promise<QueueBoardResponse> => {
  const res = await axiosInstance.get("/queue/board");
  return res.data.data as QueueBoardResponse;
};

const normalizeQueueEntry = (entry: any): QueueEntry => ({
  ...entry,
  timeAdded: entry.timeAdded ?? entry.createdAt,
});

export const fetchQueueEntries = async (params?: Record<string, any>) => {
  const res = await axiosInstance.get("/queue", { params });
  const data = res.data.data;
  // server may return { items, page, limit, total } or an array
  if (Array.isArray(data)) return data.map(normalizeQueueEntry) as QueueEntry[];
  if (data && Array.isArray(data.items))
    return data.items.map(normalizeQueueEntry) as QueueEntry[];
  return [] as QueueEntry[];
};

export const createQueueEntry = async (payload: {
  department: string;
  fullName: string;
  notes?: string;
}) => {
  const res = await axiosInstance.post("/queue", payload);
  return res.data.data as { entry: QueueEntry; board: QueueBoardResponse };
};

export const callNextPatient = async (departmentId: string) => {
  const res = await axiosInstance.post("/queue/call-next", { departmentId });
  return res.data.data as { board: QueueBoardResponse };
};

export const recallQueuePatient = async (queueId: string) => {
  const res = await axiosInstance.post(`/queue/${queueId}/recall`);
  return res.data.data as { entry: QueueEntry };
};

export const updateQueueEntry = async (
  queueId: string,
  payload: Partial<QueueEntry>,
) => {
  const res = await axiosInstance.put(`/queue/${queueId}`, payload);
  return res.data.data as { entry: QueueEntry; board?: QueueBoardResponse };
};

export const deleteQueueEntry = async (queueId: string) => {
  const res = await axiosInstance.delete(`/queue/${queueId}`);
  return res.data.data as { id: string; board: QueueBoardResponse };
};

export default {
  fetchQueueBoard,
  fetchQueueEntries,
  createQueueEntry,
  callNextPatient,
  recallQueuePatient,
  updateQueueEntry,
  deleteQueueEntry,
};
