export interface Config {
  client: ClientOptions;
}

export interface ClientOptions {
  baseUrl?: string;
  tenantId: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}
