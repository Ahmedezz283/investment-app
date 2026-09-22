import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface FlowableVariable {
  name: string;
  value: string | number | boolean | null;
  type?: string;
  scope?: 'local' | 'global';
}

interface FlowableProcessInstance {
  id: string;
  processDefinitionId?: string;
  businessKey?: string;
  ended?: boolean;
}

interface FlowableTask {
  id: string;
  name: string;
  taskDefinitionKey: string;
  processInstanceId: string;
  assignee?: string | null;
  createTime?: string;
}

@Injectable()
export class FlowableService {
  private readonly processDefinitionKey = 'Inv-v3';

  constructor(private readonly configService: ConfigService) {}

  async deployInvestmentProcess(): Promise<unknown> {
    const definition = await readFile(
      join(process.cwd(), 'Investment.bpmn20.xml'),
      'utf8',
    );
    const form = new FormData();
    form.append(
      'file',
      new Blob([definition], { type: 'application/xml' }),
      'Investment.bpmn20.xml',
    );

    return this.request('/repository/deployments', {
      method: 'POST',
      body: form,
    });
  }

  async ensureInvestmentProcessDeployed(): Promise<void> {
    const response = await this.request<{ data?: Array<{ id: string }> }>(
      `/repository/process-definitions?key=${encodeURIComponent(this.processDefinitionKey)}&latest=true`,
    );

    if (!response.data?.length) {
      await this.deployInvestmentProcess();
    }
  }

  async startInvestmentProcess(
    businessKey: string,
    variables: FlowableVariable[],
  ): Promise<FlowableProcessInstance> {
    await this.ensureInvestmentProcessDeployed();

    return this.request<FlowableProcessInstance>('/runtime/process-instances', {
      method: 'POST',
      body: JSON.stringify({
        processDefinitionKey: this.processDefinitionKey,
        businessKey,
        variables,
      }),
    });
  }

  getProcessInstance(processInstanceId: string): Promise<FlowableProcessInstance> {
    return this.request<FlowableProcessInstance>(
      `/runtime/process-instances/${encodeURIComponent(processInstanceId)}`,
    );
  }

  async getActiveTasks(processInstanceId: string): Promise<FlowableTask[]> {
    const response = await this.request<{ data: FlowableTask[] }>(
      `/runtime/tasks?processInstanceId=${encodeURIComponent(processInstanceId)}&includeProcessVariables=true`,
    );
    return response.data ?? [];
  }

  async getTasksForCandidateGroup(
    processInstanceId: string,
    candidateGroup: string,
  ): Promise<FlowableTask[]> {
    const response = await this.request<{ data: FlowableTask[] }>(
      `/runtime/tasks?processInstanceId=${encodeURIComponent(processInstanceId)}&candidateGroup=${encodeURIComponent(candidateGroup)}`,
    );
    return response.data ?? [];
  }

  completeTask(
    taskId: string,
    variables: FlowableVariable[] = [],
  ): Promise<void> {
    return this.request<void>(`/runtime/tasks/${encodeURIComponent(taskId)}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'complete', variables }),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const baseUrl = this.configService.get<string>('FLOWABLE_API_URL');
    const authorization = this.configService.get<string>('FLOWABLE_AUTH');

    if (!baseUrl || !authorization) {
      throw new BadGatewayException('Flowable configuration is incomplete');
    }

    const headers = new Headers(init.headers);
    headers.set('Authorization', authorization);
    if (init.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, { ...init, headers });
    } catch {
      throw new BadGatewayException('Unable to connect to Flowable');
    }

    if (!response.ok) {
      const message = await response.text();
      throw new BadGatewayException(
        `Flowable request failed (${response.status}): ${message || response.statusText}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const body = await response.text();
    return (body ? JSON.parse(body) : undefined) as T;
  }
}
