export const API_PATH = 'api';

export const baseUrl = (tenantId: string) => {
  return `https://${tenantId}.${API_PATH}.azurewebsites.net`;
};

export const authUrl = (tenantId: string) => {
  return `${baseUrl(tenantId)}/auth/token`;
};
