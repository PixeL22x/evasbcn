
// Native fetch is available in recent Node versions

async function main() {
    const baseUrl = 'http://localhost:3000';
    console.log(`Testing Cierre API at ${baseUrl}...`);

    try {
        // 1. Create a Cierre (POST)
        console.log('\n1. Creating Cierre (POST /api/cierre)...');
        const createRes = await fetch(`${baseUrl}/api/cierre`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trabajador: 'TestWorker',
                turno: 'tarde' // Testing 'tarde' as it has blocks
            })
        });

        if (!createRes.ok) {
            console.error('Failed to create cierre:', await createRes.text());
            return;
        }

        const createData = await createRes.json();
        console.log('Cierre created:', createData.cierreId);
        const cierreId = createData.cierreId;

        if (!createData.cierre.tareas || createData.cierre.tareas.length === 0) {
            console.warn('WARNING: POST response returned 0 tasks!');
        } else {
            console.log(`POST response returned ${createData.cierre.tareas.length} tasks.`);
        }

        // 2. Fetch Tasks (GET /api/cierre/[id])
        console.log(`\n2. Fetching Tasks (GET /api/cierre/${cierreId})...`);
        const getRes = await fetch(`${baseUrl}/api/cierre/${cierreId}`);

        if (!getRes.ok) {
            console.error('Failed to fetch cierre:', await getRes.text());
            return;
        }

        const getData = await getRes.json();
        const tareas = getData.cierre.tareas;

        console.log(`GET response returned ${tareas.length} tasks.`);

        if (tareas.length > 0) {
            console.log('\nSample Task Analysis (Task 0):');
            const task = tareas[0];
            console.log('ID:', task.id);
            console.log('Nombre:', task.nombre);
            console.log('Subtareas (Raw):', task.subtareas);
            console.log('Subtareas (Type):', typeof task.subtareas);

            if (task.subtareas) {
                try {
                    const parsed = JSON.parse(task.subtareas);
                    console.log('Subtareas parsed successfully:', parsed.length, 'items');
                } catch (e) {
                    console.error('ERROR: Could not parse subtareas JSON:', e.message);
                }
            }

            console.log('\nSample Photo Task Analysis:');
            const photoTask = tareas.find(t => t.requiereFotos);
            if (photoTask) {
                console.log('Task with photos:', photoTask.nombre);
                console.log('Fotos Requeridas (Raw):', photoTask.fotosRequeridas);
                console.log('Fotos Requeridas (Type):', typeof photoTask.fotosRequeridas);
            } else {
                console.log('No photo task found.');
            }

        } else {
            console.error('CRITICAL: No tasks found for the created cierre!');
        }

        // Clean up (Optional: Delete the test cierre)
        // await fetch(`${baseUrl}/api/cierre`, { method: 'DELETE', ... });

    } catch (error) {
        console.error('Script error:', error);
    }
}

main();
