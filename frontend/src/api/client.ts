import axios from 'axios';
import {
  Department,
  InvestmentRequest,
  User,
  UserApproval,
  FlowableTask,
  ApprovalDecision,
} from '../types';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    National_ID: string;
    role?: string;
    departmentId?: string;
    IsAssigned?: boolean;
  }) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  forgetPassword: async (email: string) => {
    const res = await api.post('/auth/forget-password', { email });
    return res.data;
  },
  addRole: async (roleName: string, description: string) => {
    const res = await api.post('/auth/add-role', { roleName, description });
    return res.data;
  },
  assignRole: async (userId: string, roleName: string) => {
    const res = await api.post(`/auth/users/${userId}/assign-role`, { roleName });
    return res.data;
  },
};

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get('/users');
    return res.data;
  },
  getById: async (id: string): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    const res = await api.patch(`/users/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
};

export const departmentsApi = {
  getAll: async (): Promise<Department[]> => {
    const res = await api.get('/departments');
    return res.data;
  },
  getById: async (id: string): Promise<Department> => {
    const res = await api.get(`/departments/${id}`);
    return res.data;
  },
  create: async (data: { name: string; description?: string }): Promise<Department> => {
    const res = await api.post('/departments', data);
    return res.data;
  },
  update: async (id: string, data: { name?: string; description?: string }): Promise<Department> => {
    const res = await api.patch(`/departments/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
  },
  assignUser: async (departmentId: string, userId: string) => {
    const res = await api.post('/departments/assign', { departmentId, userId });
    return res.data;
  },
};

export const investmentRequestsApi = {
  getAll: async (): Promise<InvestmentRequest[]> => {
    const res = await api.get('/investment-requests');
    return res.data;
  },
  getById: async (id: string): Promise<InvestmentRequest> => {
    const res = await api.get(`/investment-requests/${id}`);
    return res.data;
  },
  create: async (data: {
    investorId: string;
    companyName: string;
    amount: number;
    ruleName?: string;
  }): Promise<InvestmentRequest> => {
    const res = await api.post('/investment-requests', data);
    return res.data;
  },
  update: async (
    id: string,
    data: Partial<{ companyName: string; amount: number; status: string; riskLevel: string }>,
  ): Promise<InvestmentRequest> => {
    const res = await api.patch(`/investment-requests/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    const res = await api.delete(`/investment-requests/${id}`);
    return res.data;
  },
  getProcess: async (id: string): Promise<any> => {
    const res = await api.get(`/investment-requests/${id}/process`);
    return res.data;
  },
  getTasks: async (id: string): Promise<FlowableTask[]> => {
    const res = await api.get(`/investment-requests/${id}/tasks`);
    return res.data?.data || res.data || [];
  },
  completeTask: async (
    taskId: string,
    variables: Array<{ name: string; value: any; type?: string }>,
  ) => {
    const res = await api.post(`/investment-requests/tasks/${taskId}/complete`, { variables });
    return res.data;
  },
  requestReport: async (id: string, templateName?: string) => {
    const res = await api.post(`/investment-requests/${id}/report`, { templateName });
    return res.data;
  },
};

export const approvalsApi = {
  recordDecision: async (
    requestId: string,
    decision: ApprovalDecision,
  ): Promise<UserApproval> => {
    const res = await api.post(`/investment-requests/${requestId}/approvals`, {
      decision,
    });
    return res.data;
  },
  // Fixed: was incorrectly using POST; the controller uses @Get()
  getForRequest: async (requestId: string): Promise<UserApproval[]> => {
    const res = await api.get(`/investment-requests/${requestId}/approvals`);
    return res.data;
  },
};

export const notificationsApi = {
  missingData: async (investmentRequestId: string, investorId: string) => {
    const res = await api.post('/notifications/missing-data', {
      investmentRequestId,
      investorId,
    });
    return res.data;
  },
  rejection: async (investmentRequestId: string, investorId: string) => {
    const res = await api.post('/notifications/rejection', {
      investmentRequestId,
      investorId,
    });
    return res.data;
  },
  approval: async (investmentRequestId: string, investorId: string) => {
    const res = await api.post('/notifications/approval', {
      investmentRequestId,
      investorId,
    });
    return res.data;
  },
};

export const gorulesApi = {
  getAll: async (): Promise<any[]> => {
    const res = await api.get('/gorules');
    return res.data;
  },
  upload: async (formData: FormData): Promise<any> => {
    const res = await api.post('/gorules/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  evaluate: async (name: string, context: Record<string, any>): Promise<any> => {
    const res = await api.post(`/gorules/${name}/evaluate`, { context });
    return res.data;
  },
};

export const jasperApi = {
  listTemplates: async (): Promise<any[]> => {
    const res = await api.get('/jasper/templates');
    return res.data;
  },
  uploadTemplate: async (formData: FormData): Promise<any> => {
    const res = await api.post('/jasper/templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  generate: async (data: {
    templateName: string;
    format: string;
    parameters?: Record<string, any>;
  }): Promise<Blob> => {
    const res = await api.post('/jasper/generate', data, {
      responseType: 'blob',
    });
    return res.data;
  },
};

export default api;
