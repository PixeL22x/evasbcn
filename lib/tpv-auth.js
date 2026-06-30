/**
 * Valida el header x-api-key en las rutas del TPV auxiliar.
 * La clave debe coincidir con la variable de entorno TPV_API_KEY.
 * @param {Request} request
 * @returns {boolean}
 */
export function validateTPVApiKey(request) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || !process.env.TPV_API_KEY) return false
  return apiKey === process.env.TPV_API_KEY
}
