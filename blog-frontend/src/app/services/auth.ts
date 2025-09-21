import { api } from "../lib/api";

export async function loginApi(email: string, password: string, recaptchaToken?: string) {
  const payload: any = { email, password };
  if (recaptchaToken) {
    payload.recaptchaToken = recaptchaToken;
  }
  const { data } = await api.post("/auth/login", payload);
  return data as {
    success: boolean;
    access_token: string;
    user: { id: string; email: string; displayName?: string; role?: string };
    expiresAt?: string | null;
  };
}

export async function registerApi(email: string, password: string, displayName: string, confirmPassword: string, recaptchaToken?: string) {
  const payload: any = { email, password, displayName, confirmPassword };
  if (recaptchaToken) {
    payload.recaptchaToken = recaptchaToken;
  }
  const { data } = await api.post("/auth/register", payload);
  return data as { success: boolean, message?: string };
}

export const requestEmailCode = async (email: string, recaptchaToken?: string) => {
  const payload: any = { email };
  if (recaptchaToken) payload.recaptchaToken = recaptchaToken;
  const response = await api.post('/auth/request-email-code', payload);
  return response.data as { success: boolean; message?: string; data?: any };
};

export const verifyEmail = async (email: string, code: string) => {
  const response = await api.post('/auth/verify-email', { email, code });
  return response.data;
};

export const checkEmailAvailability = async (email: string) => {
  try {
    const response = await api.post('/auth/check-email', { email });
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 409) {
      return { available: false, message: 'Cet email est déjà utilisé' };
    }
    throw error;
  }
};

export async function forgotPassword(email: string, recaptchaToken?: string) {
  const payload: any = { email };
  if (recaptchaToken) {
    payload.recaptchaToken = recaptchaToken;
  }
  const { data } = await api.post("/auth/forgot-password", payload);
  return data as { success: boolean; message?: string };
}

export async function resetPassword(tokenId: string, token: string, newPassword: string, confirmPassword: string) {
  const { data } = await api.post("/auth/reset-password", { tokenId, token, newPassword, confirmPassword });
  return data as { success: boolean; message?: string };
}

// Fetch the current authenticated principal from backend
// Backend returns: { success: true, data: { userId, role } }
// where role may be an object with a name field or a string.
export async function getMe() {
  const { data } = await api.get("/auth/me");
  // Normalize role name
  const roleObj = data?.data?.role;
  const roleName: string | undefined = typeof roleObj === "string" ? roleObj : roleObj?.name;
  return {
    success: Boolean(data?.success),
    userId: data?.data?.userId as string | undefined,
    roleName,
    raw: data,
  } as { success: boolean; userId?: string; roleName?: string; raw: any };
}
