import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Vérification du type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Création d'un nom de fichier unique
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = new Date().getTime() + '-' + file.name.replace(/[^a-zA-Z0-9-_.]/g, '');
    const uploadDir = join(process.cwd(), 'public/uploads');
    
    // Sauvegarde du fichier
    await writeFile(join(uploadDir, filename), buffer);
    
    // Retour de l'URL de l'image
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
}