import axiosInstance from "../api/axiosInstance";

export interface UserBrief {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  role?: string;
  status?: string;
  permissions?: any;
  registeredBy?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchUsers = async (): Promise<UserBrief[]> => {
  const res = await axiosInstance.get("/users");
  return res.data.data as UserBrief[];
};

export const createUser = async (
  payload: Partial<UserBrief> & { password: string },
) => {
  // map client fields to server expected shape
  const body = {
    name: payload.name,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    status: payload.status,
    permissions: payload.permissions,
  };

  const res = await axiosInstance.post("/users/create-user", body);
  return res.data.data as UserBrief;
};

export const fetchUserById = async (id: string): Promise<UserBrief> => {
  const res = await axiosInstance.get(`/users/${id}`);
  return res.data.data as UserBrief;
};

export const updateUser = async (
  id: string,
  payload: Partial<UserBrief> & { password?: string },
) => {
  const body: any = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.firstName !== undefined) body.firstName = payload.firstName;
  if (payload.lastName !== undefined) body.lastName = payload.lastName;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.password) body.password = payload.password;
  if (payload.role !== undefined) body.role = payload.role;
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.permissions !== undefined) body.permissions = payload.permissions;

  const res = await axiosInstance.put(`/users/${id}`, body);
  return res.data.data as UserBrief;
};

export default { fetchUsers, fetchUserById, createUser, updateUser };
