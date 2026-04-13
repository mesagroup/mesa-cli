import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectType } from '../../types/scaffold';

const { scaffoldMock, setupCommandMock, isFirstRunMock, markSetupDoneMock, execSyncMock } =
  vi.hoisted(() => ({
    scaffoldMock: vi.fn(),
    setupCommandMock: vi.fn(),
    isFirstRunMock: vi.fn(),
    markSetupDoneMock: vi.fn(),
    execSyncMock: vi.fn((command: string) => {
      if (command === 'gh --version') {
        throw new Error('gh missing');
      }

      return '';
    }),
  }));

vi.mock('../../generators/scaffold', () => ({
  scaffold: scaffoldMock,
}));

vi.mock('../setup', () => ({
  setupCommand: setupCommandMock,
}));

vi.mock('../../util/first-run', () => ({
  isFirstRun: isFirstRunMock,
  markSetupDone: markSetupDoneMock,
}));

vi.mock('node:child_process', () => ({
  execSync: execSyncMock,
}));

import { initCommand } from '../init';

describe('initCommand first-run setup', () => {
  beforeEach(() => {
    scaffoldMock.mockReset();
    setupCommandMock.mockReset();
    isFirstRunMock.mockReset();
    markSetupDoneMock.mockReset();
    execSyncMock.mockClear();

    Object.defineProperty(process.stdin, 'isTTY', {
      value: true,
      configurable: true,
    });
  });

  it('marks setup as done only after a successful first-run setup', async () => {
    isFirstRunMock.mockReturnValue(true);
    setupCommandMock.mockResolvedValue(true);

    await initCommand('demo-plugin', {
      type: 'saas',
      yes: true,
      author: 'Test Author',
    });

    expect(setupCommandMock).toHaveBeenCalledWith('saas');
    expect(markSetupDoneMock).toHaveBeenCalledTimes(1);
    expect(scaffoldMock).toHaveBeenCalledTimes(1);
  });

  it('does not persist the setup marker when setup is skipped or incomplete', async () => {
    isFirstRunMock.mockReturnValue(true);
    setupCommandMock.mockResolvedValue(false);

    await initCommand('demo-plugin', {
      type: 'onprem' satisfies ProjectType,
      yes: true,
      author: 'Test Author',
    });

    expect(setupCommandMock).toHaveBeenCalledWith('onprem');
    expect(markSetupDoneMock).not.toHaveBeenCalled();
    expect(scaffoldMock).toHaveBeenCalledTimes(1);
  });
});
