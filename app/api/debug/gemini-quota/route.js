import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return NextResponse.json({
            status: 'error',
            message: 'GOOGLE_API_KEY is missing in environment variables'
        }, { status: 500 });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Usamos el modelo configurado o uno muy ligero para probar
        const modelName = "gemini-2.0-flash-lite";
        const model = genAI.getGenerativeModel({ model: modelName });

        const start = Date.now();
        const result = await model.generateContent("Test connection");
        const response = await result.response;
        const text = response.text();
        const duration = Date.now() - start;

        return NextResponse.json({
            status: 'success',
            model: modelName,
            latency: `${duration}ms`,
            message: 'API Key is working correctly (Quota available)',
            testResponse: text
        });

    } catch (error) {
        console.error("Quota Check Error:", error);

        let status = 500;
        let errorType = 'Unknown Error';
        let details = error.message;

        if (error.message.includes('429')) {
            status = 429;
            errorType = 'Quota Exceeded';
            details = 'Your API Key has exceeded its free/billed quota.';
        } else if (error.message.includes('404')) {
            status = 404;
            errorType = 'Model Not Found';
            details = 'The specified model does not exist or is not available for this key.';
        } else if (error.message.includes('API key not valid')) {
            status = 401;
            errorType = 'Invalid API Key';
        }

        return NextResponse.json({
            status: 'error',
            errorType,
            message: details,
            rawError: error.message
        }, { status: status });
    }
}
