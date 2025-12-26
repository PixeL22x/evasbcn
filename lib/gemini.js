import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function analyzeTicket(imageUrl) {
  try {
    // Para simplificar, asumimos que obtendremos la imagen como base64 o buffer en el futuro.
    // Por ahora, si es una URL de Cloudinary, necesitaremos obtener el buffer.
    // Pero Gemini también acepta URLs en ciertas configuraciones o base64.
    // La forma más robusta con la SDK es pasarle el base64.

    // Si la imagen viene de Cloudinary, la descargamos primero
    const imageResp = await fetch(imageUrl);
    const arrayBuffer = await imageResp.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = `Analiza este ticket de ventas de un negocio de heladería y cafetería.

FORMATO DEL TICKET:
Cada línea del ticket tiene 3 columnas:
[Nombre del producto]  [Cantidad de unidades vendidas]  [Total de ventas de ese producto]

Ejemplos:
- "1 bola        16    60.80" → Producto: "1 bola", Cantidad: 16, Precio total: 60.80€
- "CARROTCAKE    2     12.00" → Producto: "Carrot Cake", Cantidad: 2, Precio total: 12.00€
- "AGUA          5     10.00" → Producto: "Agua", Cantidad: 5, Precio total: 10.00€
- "SM FRESA      3     15.00" → Producto: "Smoothie Fresa", Cantidad: 3, Precio total: 15.00€

IMPORTANTE: El número en el nombre del producto (como "1 bola", "2 bolas") es PARTE DEL NOMBRE, NO la cantidad vendida.

REGLAS DE NORMALIZACIÓN Y CORRECCIÓN:

1. PRODUCTOS DE HELADO:
   - Si lees "RULOS", "ROLOS" → corrige a "bolas" (ej: "3 RULOS" → "3 bolas")
   - Mantén el formato: "1 bola", "2 bolas", "3 bolas", "4 bolas" (en minúsculas)

2. PRODUCTOS DE XURROS/CHURROS:
   - Si lees "XUROS", "XURROS", "CHUROS", "CHURROS":
     * Con 4 unidades → "4 Xurros"
     * Con 6 unidades → "6 Xurros"
     * Con 1 unidad o "adicional" → "Xurro adicional"
     * Si no puedes determinar → "4 Xurros" (por defecto)

3. ABREVIACIONES COMUNES:
   - "SM " → "Smoothie " (ej: "SM FRESA" → "Smoothie Fresa")
   - "MK " → "Milkshake " (ej: "MK VAINILLA" → "Milkshake Vainilla")
   - "CREP", "CREPE" → "CREP"
   - "GOFRE", "WAFFLE" → "GOFRE"

4. OTROS PRODUCTOS (Captura TODO lo que veas):
   - "CARROTCAKE" → "Carrot Cake"
   - "CHOCOLATE A LA TAZA" → "Chocolate a la Taza"
   - "TARTA CHOCOLATE" → "Tarta de Chocolate"
   - "AGUA" → "Agua"
   - "CAFE" → "Café"
   - "TE" → "Té"
   - Para cualquier otro producto: capitaliza correctamente y hazlo legible

5. CAPITALIZACIÓN:
   - Nombres de sabores: Primera letra mayúscula (Fresa, Mango, Plátano, Vainilla, Chocolate)
   - Productos estándar: Mantén formato específico (CREP, GOFRE en mayúsculas)
   - Otros productos: Formato título (Primera Letra Mayúscula)

INSTRUCCIONES CRÍTICAS:
✓ Debes capturar ABSOLUTAMENTE TODOS los items que aparezcan en el ticket
✓ No omitas ningún producto, incluso si no está en la lista de productos conocidos
✓ Si ves un producto que no reconoces, inclúyelo de todas formas con el nombre más legible posible
✓ Respeta siempre el formato de 3 columnas: [Nombre] [Cantidad] [Precio Total]

Devuelve EXCLUSIVAMENTE un JSON válido (sin bloques de código markdown):
{
  "total": 0.00,
  "items": [
    {
      "nombre": "Nombre del producto normalizado",
      "cantidad": 1,
      "precio": 0.00
    }
  ]
}

RECORDATORIO FINAL:
- Captura TODOS los items sin excepción
- Aplica las normalizaciones solo a productos conocidos
- Para productos desconocidos, usa el nombre que aparece en el ticket (capitalizado correctamente)
- El total debe ser la suma de todos los precios de los items`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg", // Asumimos jpeg/png, gemini suele ser flexible
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Limpiar markdown si Gemini lo incluye
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Error al analizar ticket con Gemini:", error);
    throw new Error("Falló el análisis del ticket por IA");
  }
}
