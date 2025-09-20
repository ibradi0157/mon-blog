// src/app/services/email-templates.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

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

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Get all email templates
export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/email-templates`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des templates');
  }

  return response.json();
};

// Get a single email template
export const getEmailTemplate = async (id: string): Promise<EmailTemplate> => {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/email-templates/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du template');
  }

  return response.json();
};

// Create a new email template
export const createEmailTemplate = async (data: CreateEmailTemplateDto): Promise<EmailTemplate> => {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/email-templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la création du template');
  }

  return response.json();
};

// Update an email template
export const updateEmailTemplate = async (id: string, data: UpdateEmailTemplateDto): Promise<EmailTemplate> => {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/email-templates/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour du template');
  }

  return response.json();
};

// Delete an email template
export const deleteEmailTemplate = async (id: string): Promise<void> => {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/email-templates/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la suppression du template');
  }
};

// Preview template with variables
export const previewEmailTemplate = async (id: string, variables: Record<string, string>): Promise<RenderedTemplate> => {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/email-templates/${id}/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify({ variables }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la prévisualisation du template');
  }

  return response.json();
};
