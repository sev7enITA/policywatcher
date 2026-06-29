/**
 * Decrypt Backup API for Verification
 *
 * POST /api/admin/decrypt-backup
 *
 * Receives the encrypted backup payload and password, validates the signature/HMAC,
 * and decrypts it back to JSON. Allows admins to verify the integrity and preview
 * the content of their encrypted backups.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { createDecipheriv, scryptSync } from 'crypto';

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

    const parts = encryptedString.split(':');
    if (parts.length !== 4) {
      return NextResponse.json(
        { error: 'Invalid file format. The file is corrupted or not a valid PolicyWatcher backup.' },
        { status: 400 }
      );
    }

    const [saltHex, ivHex, authTagHex, encryptedHex] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Re-derive key
    const key = scryptSync(password, salt, 32);

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const parsedData = JSON.parse(decrypted);

    return NextResponse.json({
      success: true,
      summary: parsedData.summary,
      exportedAt: parsedData.exportedAt,
      version: parsedData.version,
    });
  } catch (error) {
    console.error('[Decrypt Backup] Error:', error);
    return NextResponse.json(
      { error: 'Decryption failed. Please verify that the password is correct and the file is not tampered with.' },
      { status: 400 }
    );
  }
}
