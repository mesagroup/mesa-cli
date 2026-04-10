import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientSDK } from '../client';

describe('ClientSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('uses baseUrl override for login and requests', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token-123',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'refresh-123',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });

    const client = new ClientSDK({
      client: {
        tenantId: 'tenant-a',
        baseUrl: 'https://mesa.example.test/custom/',
      },
    });

    await client.login({ username: 'demo', password: 'secret' });
    const payload = await client.request<{ ok: boolean }>('/health');

    expect(payload).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://mesa.example.test/custom/auth/token',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://mesa.example.test/custom/health',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
  });
});
