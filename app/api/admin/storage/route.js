import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Free tier limits (approximate)
const MONGODB_LIMIT_BYTES = 512 * 1024 * 1024    // 512 MB (Atlas M0 free)
const CLOUDINARY_LIMIT_BYTES = 25 * 1024 * 1024 * 1024 // 25 GB free

export async function GET() {
    const results = { mongodb: null, cloudinary: null, errors: [] }

    // ─── MongoDB dbStats ───────────────────────────────────────
    try {
        const stats = await prisma.$runCommandRaw({ dbStats: 1, scale: 1 })

        const dataSize = stats.dataSize ?? 0
        const storageSize = stats.storageSize ?? 0
        const indexSize = stats.indexSize ?? 0
        const totalSize = dataSize + indexSize

        results.mongodb = {
            dataSize,
            storageSize,
            indexSize,
            totalSize,
            totalSizeMB: +(totalSize / 1024 / 1024).toFixed(2),
            limitMB: +(MONGODB_LIMIT_BYTES / 1024 / 1024).toFixed(0),
            pct: +((totalSize / MONGODB_LIMIT_BYTES) * 100).toFixed(1),
            collections: stats.collections ?? 0,
            objects: stats.objects ?? 0,
        }
    } catch (err) {
        console.error('Error fetching MongoDB stats:', err)
        results.errors.push(`MongoDB: ${err.message}`)
    }

    // ─── Cloudinary usage ──────────────────────────────────────
    try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME
        const apiKey = process.env.CLOUDINARY_API_KEY
        const apiSecret = process.env.CLOUDINARY_API_SECRET

        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/usage`,
            {
                headers: { Authorization: `Basic ${credentials}` },
                // 8s timeout
                signal: AbortSignal.timeout(8000)
            }
        )

        if (!res.ok) throw new Error(`Cloudinary API ${res.status}`)

        const data = await res.json()

        const usedBytes = data.storage?.usage ?? 0
        const limitBytes = data.storage?.limit ?? CLOUDINARY_LIMIT_BYTES
        const bandwidthUsed = data.bandwidth?.usage ?? 0
        const bandwidthLimit = data.bandwidth?.limit ?? 0
        const resources = data.resources ?? 0
        const transformations = data.transformations?.usage ?? 0

        results.cloudinary = {
            usedBytes,
            usedMB: +(usedBytes / 1024 / 1024).toFixed(2),
            limitMB: +(limitBytes / 1024 / 1024).toFixed(0),
            pct: limitBytes > 0 ? +((usedBytes / limitBytes) * 100).toFixed(1) : 0,
            bandwidthUsedMB: +(bandwidthUsed / 1024 / 1024).toFixed(2),
            bandwidthLimitMB: +(bandwidthLimit / 1024 / 1024).toFixed(0),
            bandwidthPct: bandwidthLimit > 0 ? +((bandwidthUsed / bandwidthLimit) * 100).toFixed(1) : 0,
            resources,
            transformations,
            plan: data.plan ?? 'Free'
        }
    } catch (err) {
        console.error('Error fetching Cloudinary usage:', err)
        results.errors.push(`Cloudinary: ${err.message}`)
    }

    results.fetchedAt = new Date().toISOString()
    return NextResponse.json(results)
}
