/**
 * Decrypt Backup API for Verification
 *
 * POST /api/admin/decrypt-backup
 *
 * Receives a current versioned envelope or legacy v1 export, authenticates and
 * decrypts it, and returns only a bounded summary. It never restores records.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { decryptBackupFile, summarizeDecryptedBackup } from '@/lib/encryptedBackup';

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { encryptedString, password } = await request.json();

    if (!encryptedString || !password) {
      return NextResponse.json(
        { error: 'Missing encrypted data or password.' },
        { status: 400 }
      );
    }

    const parsedData = await decryptBackupFile(encryptedString, password);
    return NextResponse.json({
      success: true,
      ...summarizeDecryptedBackup(parsedData),
    });
  } catch (error) {
    console.error('[Decrypt Backup] Error:', error);
    return NextResponse.json(
      { error: 'Decryption failed. Please verify that the password is correct and the file is not tampered with.' },
      { status: 400 }
    );
  }
}
