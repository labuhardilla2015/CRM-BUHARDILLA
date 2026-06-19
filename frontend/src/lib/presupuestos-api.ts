import { api } from './api';

export type EstadoPresupuesto = 'BORRADOR' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO';

export const ESTADO_PRESUPUESTO_LABEL: Record<EstadoPresupuesto, string> = {
  BORRADOR: 'Borrador',
  ENVIADO: 'Enviado',
  ACEPTADO: 'Aceptado',
  RECHAZADO: 'Rechazado',
};

export interface Presupuesto {
  id: string;
  potencialId: string | null;
  concepto: string;
  detalle: string | null;
  monto: string; // Decimal serializado
  estado: EstadoPresupuesto;
  tokenAceptacion: string | null;
  aceptadoAt: string | null;
  createdAt: string;
}

export interface PresupuestoInput {
  concepto?: string;
  detalle?: string;
  monto?: number;
}

export function formatEuro(monto: string | number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(monto));
}

export async function getPresupuestos(potencialId: string): Promise<Presupuesto[]> {
  const { data } = await api.get<Presupuesto[]>(`/potenciales/${potencialId}/presupuestos`);
  return data;
}

export async function crearPresupuesto(potencialId: string, body: PresupuestoInput): Promise<Presupuesto> {
  const { data } = await api.post<Presupuesto>(`/potenciales/${potencialId}/presupuestos`, body);
  return data;
}

export async function enviarPresupuesto(id: string): Promise<{ token: string }> {
  const { data } = await api.post<{ token: string }>(`/presupuestos/${id}/enviar`);
  return data;
}

export async function eliminarPresupuesto(id: string): Promise<void> {
  await api.delete(`/presupuestos/${id}`);
}

// ─── Público (sin login) ─────────────────────────────────────────────
export interface PresupuestoPublico {
  concepto: string;
  detalle: string | null;
  monto: string;
  estado: EstadoPresupuesto;
  aceptadoAt: string | null;
  destinatario: string | null;
}

export async function getPresupuestoPublico(token: string): Promise<PresupuestoPublico> {
  const { data } = await api.get<PresupuestoPublico>(`/publico/presupuestos/${token}`);
  return data;
}

export async function aceptarPresupuesto(token: string): Promise<{ estado: EstadoPresupuesto }> {
  const { data } = await api.post<{ estado: EstadoPresupuesto }>(`/publico/presupuestos/${token}/aceptar`);
  return data;
}

export async function rechazarPresupuesto(token: string): Promise<{ estado: EstadoPresupuesto }> {
  const { data } = await api.post<{ estado: EstadoPresupuesto }>(`/publico/presupuestos/${token}/rechazar`);
  return data;
}
