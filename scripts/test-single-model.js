const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testSingleModel() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("❌ No GOOGLE_API_KEY found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-2.0-flash-lite";

    console.log(`Testing SPECIFIC model: ${modelName}`);
    console.log(`Using API Key starting with: ${apiKey.substring(0, 4)}...`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you there?");
        console.log(`✅ SUCCESS! The model '${modelName}' is working.`);
        console.log("Response:", result.response.text());
    } catch (e) {
        console.log(`❌ FAILED for '${modelName}'`);
        console.log("Error Message:", e.message);

        if (e.message.includes("429")) {
            console.log("\n⚠️  DIAGNOSIS: QUOTA EXCEEDED");
            console.log("The model name is CORRECT, but your API Key has hit its usage limit.");
        } else if (e.message.includes("404")) {
            console.log("\n⚠️  DIAGNOSIS: MODEL NOT FOUND");
            console.log("The model name might be incorrect or not available to your key's tier.");
        } else if (e.message.includes("400") || e.message.includes("API key expired")) {
            console.log("\n⚠️  DIAGNOSIS: API KEY EXPIRED");
            console.log("Your API Key is no longer valid. You need a new one.");
        }
    }
}

testSingleModel();
