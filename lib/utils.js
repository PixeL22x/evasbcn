import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  if (!amount && amount !== 0) return "€0.00";
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Funciones para manejar zona horaria de Barcelona
export function getBarcelonaTime() {
  // Crear fecha en zona horaria de Barcelona (Europe/Madrid)
  const now = new Date();
  const barcelonaTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Madrid"}));
  return barcelonaTime;
}

export function getBarcelonaTimeInfo() {
  const barcelonaTime = getBarcelonaTime();
  const currentHour = barcelonaTime.getHours();
  const currentMinute = barcelonaTime.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // minutos desde medianoche
  const dayOfWeek = barcelonaTime.getDay(); // 0 = Domingo, 6 = Sábado
  const today = barcelonaTime.toISOString().split('T')[0]; // YYYY-MM-DD
  
  return {
    date: barcelonaTime,
    hour: currentHour,
    minute: currentMinute,
    timeInMinutes: currentTime,
    dayOfWeek,
    today,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6
  };
}
