async function checkConnectivity() {
    const url = 'https://generativelanguage.googleapis.com';
    console.log(`Testing connectivity to ${url}...`);

    try {
        const start = Date.now();
        const response = await fetch(url);
        const duration = Date.now() - start;

        console.log(`✅ Status: ${response.status} ${response.statusText}`);
        console.log(`⏱️ Latency: ${duration}ms`);
        console.log('Headers:', response.headers);
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

checkConnectivity();
