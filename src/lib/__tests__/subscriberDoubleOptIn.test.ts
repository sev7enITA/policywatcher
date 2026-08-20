import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  sendConfirmationRequest: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    subscriber: {
      findUnique: mocks.findUnique,
      create: mocks.create,
      update: mocks.update,
    },
  },
}));

vi.mock('@/lib/mailer', () => ({
  sendSubscriptionConfirmationRequest: mocks.sendConfirmationRequest,
}));

import { POST as requestSubscription } from '@/app/api/subscribers/route';
import { POST as confirmSubscription } from '@/app/api/subscribers/confirm/route';

function jsonRequest(path: string, body: Record<string, unknown>) {
  return new NextRequest(`https://policywatcher.test${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('subscriber double opt-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendConfirmationRequest.mockResolvedValue(true);
  });

  it('stores a new request as inactive and sends a single-use confirmation token', async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockImplementation(async ({ data }) => ({ id: 'sub-1', ...data }));

    const response = await requestSubscription(jsonRequest('/api/subscribers', {
      email: 'reader@example.test',
    }));

    expect(response.status).toBe(202);
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      email: 'reader@example.test',
      isActive: false,
      confirmationToken: expect.stringMatching(/^[a-f0-9-]{36}$/),
      confirmationRequestedAt: expect.any(Date),
      confirmedAt: null,
    }) });
    expect(mocks.sendConfirmationRequest).toHaveBeenCalledWith(
      'reader@example.test', undefined, 'EU,US,Global', 'Tech Giant,FinTech', 'INSTANT',
      expect.stringMatching(/^[a-f0-9-]{36}$/),
    );
  });

  it('activates only a matching pending record and records confirmation time', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'sub-1', email: 'reader@example.test', isActive: false,
      confirmationRequestedAt: new Date(),
    });
    mocks.update.mockResolvedValue({ id: 'sub-1', isActive: true });

    const response = await confirmSubscription(jsonRequest('/api/subscribers/confirm', {
      email: 'reader@example.test',
      token: 'confirmation-token-value',
    }));

    expect(response.status).toBe(200);
    expect(mocks.findUnique).toHaveBeenCalledWith({ where: { confirmationToken: 'confirmation-token-value' } });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { isActive: true, confirmedAt: expect.any(Date), confirmationToken: null },
    });
  });

  it('leaves an expired confirmation request inactive', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'sub-1',
      email: 'reader@example.test',
      isActive: false,
      confirmationRequestedAt: new Date(Date.now() - 49 * 60 * 60 * 1000),
    });

    const response = await confirmSubscription(jsonRequest('/api/subscribers/confirm', {
      email: 'reader@example.test',
      token: 'expired-confirmation-token',
    }));

    expect(response.status).toBe(200);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('requires an explicit POST and keeps credentials in the URL fragment', () => {
    const mailer = readFileSync('src/lib/mailer.ts', 'utf8');
    const page = readFileSync('src/app/confirm-subscription/page.tsx', 'utf8');
    expect(mailer).toContain('/confirm-subscription#${fragment}');
    expect(page).toContain("window.location.hash.slice(1)");
    expect(page).toContain("fetch('/api/subscribers/confirm'");
    expect(page).not.toContain('void confirm();\n  }, []);');
  });
});
