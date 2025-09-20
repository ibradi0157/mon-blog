import { NextResponse } from 'next/server';
import { writeFile, mkdir, stat } from 'fs/promises';
import { join, dirname } from 'path';

const ALLOWED_IMAGE_MIME = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'
];
const ALLOWED_FILE_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB default

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = (formData.get('file') || formData.get('image')) as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const type = file.type || 'application/octet-stream';
    const allowed = ALLOWED_IMAGE_MIME.includes(type) || ALLOWED_FILE_MIME.includes(type);
    if (!allowed) {
      return NextResponse.json({ error: `Unsupported file type: ${type}` }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `File too large. Max ${Math.round(MAX_SIZE_BYTES/1024/1024)}MB` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitized = (file.name || 'file')
      .replace(/[^a-zA-Z0-9-_.]/g, '-')
      .replace(/-+/g, '-');
    const timestamp = Date.now();
    const filename = `${timestamp}-${sanitized}`;
    const publicDir = join(process.cwd(), 'public');
    const uploadDir = join(publicDir, 'uploads');

    // Ensure directory exists
    try { await stat(uploadDir); } catch { await mkdir(uploadDir, { recursive: true }); }

    await writeFile(join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url, name: file.name, mime: type, size: file.size });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}
