/**
 * Encrypted Export API for Admin Data Backup
 *
 * POST /api/admin/export-encrypted
 *
 * Exports all database tables (companies, policies, snapshots, changes, impacts, subscribers)
 * in a secure encrypted format. Uses AES-256-GCM. The key is derived from the user-provided
 * password using scrypt with a random salt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { randomBytes, createCipheriv, scryptSync } from 'crypto';

const MIN_BACKUP_PASSWORD_LENGTH = 12;

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { password } = await request.json();
    if (!password || password.length < MIN_BACKUP_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_BACKUP_PASSWORD_LENGTH} characters long.` },
        { status: 400 }
      );
    }

    // Fetch all system data
    const [companies, policies, snapshots, changes, impacts, subscribers] = await Promise.all([
      db.company.findMany(),
      db.policy.findMany(),
      db.policySnapshot.findMany(),
      db.policyChange.findMany(),
      db.regionImpact.findMany(),
      db.subscriber.findMany(),
    ]);

    const backupPayload = {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      summary: {
        companies: companies.length,
        policies: policies.length,
        snapshots: snapshots.length,
        changes: changes.length,
        subscribers: subscribers.length,
      },
      data: {
        companies,
        policies,
        snapshots,
        changes,
        impacts,
        subscribers,
      },
    };

    const jsonString = JSON.stringify(backupPayload);

    // Secure key derivation and GCM encryption
    const salt = randomBytes(16);
    const key = scryptSync(password, salt, 32); // 256-bit key
    const iv = randomBytes(12); // GCM standard 12-byte IV

    const cipher = createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(jsonString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Format: salt:iv:authTag:encryptedPayload
    const encryptedFileContent = [
      salt.toString('hex'),
      iv.toString('hex'),
      authTag,
      encrypted,
    ].join(':');

    return new NextResponse(encryptedFileContent, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="policywatcher-backup-encrypted.enc"',
      },
    });
  } catch (error) {
    console.error('[Export Encrypted] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during encrypted export.' },
      { status: 500 }
    );
  }
}
