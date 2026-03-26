import { AuthResponse, Config, LoginCredentials } from '../types';
import { baseUrl } from '../util/url-resolver';

export const apiPath = {
  authToken: '/auth/token',
};

export class Auth {
  private tenantId: string;
  private credentials: LoginCredentials;

  constructor(config: Config, credentials?: LoginCredentials) {
    if (!credentials) {
      throw new Error('Credentials are required');
    }

    this.tenantId = config.client.tenantId;
    this.credentials = credentials;
  }

  async getAuthToken() {
    const params = new URLSearchParams({
      client_id: this.tenantId,
      grant_type: 'password',
      username: this.credentials.username,
      password: this.credentials.password,
    });

    const response = await fetch(`${baseUrl(this.tenantId)}${apiPath.authToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const data = (await response.json()) as AuthResponse;
    return data;
  }
}
