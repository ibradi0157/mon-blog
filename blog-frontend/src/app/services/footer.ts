import { api } from '../lib/api';

export interface FooterLink {
  text: string;
  href: string;
  external?: boolean;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterData {
  id?: string;
  title: string;
  description: string;
  sections: FooterSection[];
  copyrightText: string;
  showSocialLinks: boolean;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
  };
  backgroundColor: string;
  textColor: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateFooterDto {
  title?: string;
  description?: string;
  sections?: FooterSection[];
  copyrightText?: string;
  showSocialLinks?: boolean;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
  };
  backgroundColor?: string;
  textColor?: string;
}

export async function getPublicFooter(): Promise<{ success: boolean; data: Omit<FooterData, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> }> {
  const response = await api.get('/footer');
  return response.data;
}

export async function getAdminFooter(): Promise<{ success: boolean; data: FooterData }> {
  const response = await api.get('/footer/admin');
  return response.data;
}

export async function updateFooter(data: Partial<FooterData>): Promise<{ success: boolean; data: FooterData }> {
  const response = await api.put('/footer/admin', data);
  return response.data;
}

export async function resetFooter(): Promise<{ success: boolean; data: FooterData }> {
  const response = await api.post('/footer/admin/reset');
  return response.data;
}
