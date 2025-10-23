import { api } from "../lib/api";

export async function subscribeNewsletter(email: string) {
  const { data } = await api.post('/newsletter/subscribe', { email });
  return data as { success: boolean; message: string };
}

export async function unsubscribeNewsletter(email: string, token: string) {
  const { data } = await api.post('/newsletter/unsubscribe', { email, token });
  return data as { success: boolean; message: string };
}
