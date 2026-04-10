import type { ClientOptions } from '../types';

export const API_PATH = 'api';

export const defaultBaseUrl = (tenantId: string) => {
  return `https://${tenantId}.${API_PATH}.azurewebsites.net`;
};

export const baseUrl = (client: Pick<ClientOptions, 'tenantId' | 'baseUrl'>) => {
  return client.baseUrl?.replace(/\/$/, '') || defaultBaseUrl(client.tenantId);
};

export const authUrl = (client: Pick<ClientOptions, 'tenantId' | 'baseUrl'>) => {
  return `${baseUrl(client)}/auth/token`;
};
