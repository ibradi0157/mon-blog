// src/app/services/email-templates.ts
import { api } from "../lib/api";

export interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  description: string;
  availableVariables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateDto {
  type: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  description: string;
  availableVariables: string[];
  isActive: boolean;
}

export interface UpdateEmailTemplateDto {
  name?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  description?: string;
  availableVariables?: string[];
  isActive?: boolean;
}

export interface PreviewTemplateDto {
  variables: Record<string, string>;
}

export interface RenderedTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface SendTestPayload {
  to: string;
  variables?: Record<string, string>;
}

// Note: auth token and CSRF are handled globally by the shared axios client

// Get all email templates
export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  const { data } = await api.get("/email-templates");
  return data;
};

// Get a single email template
export const getEmailTemplate = async (id: string): Promise<EmailTemplate> => {
  const { data } = await api.get(`/email-templates/${id}`);
  return data;
};

// Create a new email template
export const createEmailTemplate = async (payload: CreateEmailTemplateDto): Promise<EmailTemplate> => {
  const { data } = await api.post("/email-templates", payload);
  return data;
};

// Update an email template
export const updateEmailTemplate = async (id: string, payload: UpdateEmailTemplateDto): Promise<EmailTemplate> => {
  const { data } = await api.patch(`/email-templates/${id}`, payload);
  return data;
};

// Delete an email template
export const deleteEmailTemplate = async (id: string): Promise<void> => {
  await api.delete(`/email-templates/${id}`);
};

// Preview template with variables
export const previewEmailTemplate = async (id: string, variables: Record<string, string>): Promise<RenderedTemplate> => {
  // Send variables directly in body; CSRF handled by interceptor
  const { data } = await api.post(`/email-templates/${id}/preview`, variables, {
    // This is an admin-only tool; suppress noisy logs if we trigger validation errors while editing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...( { _expectedStatuses: [400], _suppressErrorLog: true } as any ),
  });
  return data;
};

// Send a test email using a template
export const sendTestEmailTemplate = async (id: string, payload: SendTestPayload): Promise<{ success: boolean }> => {
  const { data } = await api.post(`/email-templates/${id}/send-test`, payload, {
    // suppress expected 400 errors from validation without throwing dev overlays
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...( { _expectedStatuses: [400], _suppressErrorLog: true } as any ),
  });
  return data;
};
