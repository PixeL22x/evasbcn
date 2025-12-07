import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'NOT_SET',
      api_key: process.env.CLOUDINARY_API_KEY || 'NOT_SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT_SET'
    },
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
}
