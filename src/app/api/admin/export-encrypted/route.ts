/**
 * Encrypted Export API for Admin Data Backup
 *
 * POST /api/admin/export-encrypted
 *
 * Exports all application tables in a versioned AES-256-GCM envelope. This is
 * a portable verification export, not by itself a tested database restore.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import {
  buildCompleteBackupPayload,
  encryptBackupPayload,
  MAX_BACKUP_PASSWORD_LENGTH,
  MIN_BACKUP_PASSWORD_LENGTH,
} from '@/lib/encryptedBackup';

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { password } = await request.json();
    if (typeof password !== 'string' || password.length < MIN_BACKUP_PASSWORD_LENGTH || password.length > MAX_BACKUP_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_BACKUP_PASSWORD_LENGTH} characters long.` },
        { status: 400 }
      );
    }

    const backupPayload = await buildCompleteBackupPayload(db);
    const encryptedFileContent = await encryptBackupPayload(backupPayload, password);

    return new NextResponse(encryptedFileContent, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="policywatcher-backup-encrypted.enc"',
        'Cache-Control': 'no-store, max-age=0',
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
