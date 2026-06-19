/** Utilidades de formato de tiempo compartidas por el módulo Reloj. */

/** Segundos → "Xh Ym" (legible para informes). */
export function formatHoras(totalSeg: number): string {
  const s = Math.max(0, Math.round(totalSeg));
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

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

/** Lunes 00:00 de la semana que contiene `ref`. */
export function inicioSemana(ref: Date): Date {
  const d = new Date(ref);
  const dia = (d.getDay() + 6) % 7; // 0 = lunes
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dia);
  return d;
}

/** Suma días a una fecha (sin mutar). */
export function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

/** Inicio del día (00:00) de hoy. */
export function inicioHoy(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** ISO → valor para <input type="datetime-local"> (hora local). */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

/** Valor de <input type="datetime-local"> → ISO (UTC). */
export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}
