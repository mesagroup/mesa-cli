import { Config, LoginCredentials } from '../types';
import { baseUrl } from '../util/url-resolver';
import { Auth } from './auth';

export class ClientSDK {
  private config: Config;
  private token?: string;

  constructor(config: Config) {
    this.config = config;
  }

  async login(credentials?: LoginCredentials) {
    const auth = new Auth(this.config, credentials);
    const result = await auth.getAuthToken();
    this.token = result.access_token;
    return result;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${baseUrl(this.config.client.tenantId)}/${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}
