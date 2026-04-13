import { AuthResponse, Config, LoginCredentials } from '../types';
import { authUrl } from '../util/url-resolver';

export const apiPath = {
  authToken: '/auth/token',
};

export class Auth {
  private config: Config;
  private credentials: LoginCredentials;

  constructor(config: Config, credentials?: LoginCredentials) {
    if (!credentials) {
      throw new Error('Credentials are required');
    }

    this.config = config;
    this.credentials = credentials;
  }

  async getAuthToken() {
    const params = new URLSearchParams({
      client_id: this.config.client.tenantId,
      grant_type: 'password',
      username: this.credentials.username,
      password: this.credentials.password,
    });

    const response = await fetch(authUrl(this.config.client), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as AuthResponse;
    return data;
  }
}
