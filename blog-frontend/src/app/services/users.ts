import { api } from "../lib/api";
import type { RoleName } from "../providers/AuthProvider";

export type User = {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  avatarUrl?: string | null;
  role?: { name: RoleName } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UsersListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "ASC" | "DESC";
};

export async function listUsers(params?: UsersListParams) {
  const { data } = await api.get("/users", { params });
  return data as { success: boolean; data: User[]; pagination: { total: number; page: number; limit: number; pages: number } };
}

export async function createUser(payload: { email: string; displayName: string; password: string; confirmPassword: string }) {
  const { data } = await api.post("/users", payload);
  return data as { success: boolean; data: User };
}

export async function changeUserRole(id: string, role: Extract<RoleName, "SECONDARY_ADMIN" | "MEMBER">) {
  const { data } = await api.patch(`/users/${id}/role`, { role });
  return data as { success: boolean; data: { id: string; role: RoleName } };
}

export async function deleteUser(id: string) {
  const { data } = await api.delete(`/users/${id}`);
  return data as { success: boolean };
}

export async function purgeMembers() {
  const { data } = await api.delete("/users/purge/members");
  return data as { success: boolean; deleted: number };
}
