import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

export async function POST(request) {
    try {
        const { prompt, categorias } = await request.json()

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        const result = await model.generateContent(prompt)
        const response = result.response
        let svgCode = response.text()

        // Limpiar el código SVG (quitar markdown si existe)
        svgCode = svgCode.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim()

        // Si la IA no genera SVG válido, crear uno simple
        if (!svgCode.includes('<svg')) {
            svgCode = generarSVGSimple(categorias)
        }

        return NextResponse.json({ svgCode })
    } catch (error) {
        console.error('Error generando gráfico:', error)

        // Fallback: generar SVG simple
        const { categorias } = await request.json()
        const svgCode = generarSVGSimple(categorias)

        return NextResponse.json({ svgCode })
    }
}

// Fallback: generar SVG simple si la IA falla
function generarSVGSimple(categorias) {
    const total = categorias.reduce((sum, c) => sum + parseFloat(c.value), 0)
    let currentAngle = 0

    const paths = categorias.map(cat => {
        const percentage = parseFloat(cat.value)
        const angle = (percentage / 100) * 360
        const endAngle = currentAngle + angle

        const x1 = 200 + 150 * Math.cos((currentAngle - 90) * Math.PI / 180)
        const y1 = 200 + 150 * Math.sin((currentAngle - 90) * Math.PI / 180)
        const x2 = 200 + 150 * Math.cos((endAngle - 90) * Math.PI / 180)
        const y2 = 200 + 150 * Math.sin((endAngle - 90) * Math.PI / 180)

        const largeArc = angle > 180 ? 1 : 0

        const path = `M 200,200 L ${x1},${y1} A 150,150 0 ${largeArc},1 ${x2},${y2} Z`

        currentAngle = endAngle

        return `<path d="${path}" fill="${cat.color}" stroke="white" stroke-width="2"/>`
    }).join('\n')

    const legend = categorias.map((cat, i) => `
        <g transform="translate(20, ${320 + i * 20})">
            <rect width="15" height="15" fill="${cat.color}"/>
            <text x="20" y="12" font-family="Arial" font-size="12">${cat.label} (${cat.value}%)</text>
        </g>
    `).join('\n')

    return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="white"/>
        ${paths}
        ${legend}
    </svg>`
}
