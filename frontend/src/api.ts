import axios from 'axios';
import type { InvestmentRequest, Investor, LoginResponse } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000'),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('investment_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { username, password });
  if (!response.data.access_token) {
    throw new Error('The authentication service did not return an access token.');
  }
  return response.data;
}

export async function getInvestments(): Promise<InvestmentRequest[]> {
  const response = await api.get<InvestmentRequest[]>('/investment-requests');
  if (!Array.isArray(response.data)) {
    throw new Error('The investments response was not a list.');
  }
  return response.data;
}

export async function getInvestors(): Promise<Investor[]> {
  const response = await api.get<Investor[]>('/users');
  if (!Array.isArray(response.data)) {
    throw new Error('The investors response was not a list.');
  }
  return response.data;
}

export function logout() {
  sessionStorage.removeItem('investment_access_token');
}

export async function createInvestment(input: {
  investorId: string;
  companyName: string;
  amount: number;
  ruleName: string;
}): Promise<InvestmentRequest> {
  const response = await api.post<InvestmentRequest>('/investment-requests', input);
  return response.data;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
    if (error.code === 'ERR_NETWORK') {
      return 'Could not reach the API. Check that the backend is running, then try again.';
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
