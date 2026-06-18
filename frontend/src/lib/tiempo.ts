/** Utilidades de formato de tiempo compartidas por el módulo Reloj. */

/** Segundos → "HH:MM:SS". */
export function formatDuracion(totalSeg: number): string {
  const s = Math.max(0, Math.floor(totalSeg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

/** Duración entre dos ISO (o hasta ahora si no hay fin), en segundos. */
export function duracionSeg(inicio: string, fin?: string | null): number {
  const ini = new Date(inicio).getTime();
  const end = fin ? new Date(fin).getTime() : Date.now();
  return (end - ini) / 1000;
}

export function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}
