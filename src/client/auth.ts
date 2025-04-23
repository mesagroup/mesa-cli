import { baseUrl } from '../util/url-resolver';

export const apiPath = {
  authToken: '/auth/token',
};

export const getAuthToken = async (instanceName: string) => {
  const response = await fetch(`${baseUrl(instanceName)}${apiPath.authToken}`);
  const data = await response.json();
  return data.token;
};
