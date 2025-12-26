const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    const modelsToTest = [
        "gemini-1.5-flash-8b",
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro-exp-0827",
        "gemini-1.5-flash"
    ];

    console.log("Testing API Key with experimental models...");

    for (const modelName of modelsToTest) {
        try {
            console.log(`\nTesting: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            console.log(`✅ SUCCESS: ${modelName} is available.`);
        } catch (e) {
            console.log(`❌ FAILED: ${modelName}`);
            const msg = e.message.split('\n')[0];
            console.log(`Error: ${msg}`);
            if (e.message.includes("429")) console.log("Status: 429 Quota Exceeded");
        }
    }
}

listModels();
