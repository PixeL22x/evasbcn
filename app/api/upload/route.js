import { NextResponse } from 'next/server'
import { uploadImage } from '../../../lib/cloudinary'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const fileName = formData.get('fileName') || 'photo'
    const folder = formData.get('folder') || 'evas-barcelona'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subir a Cloudinary
    const result = await uploadImage(buffer, fileName, folder)

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
