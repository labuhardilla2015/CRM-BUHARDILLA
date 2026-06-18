/**
 * Constantes y tipos compartidos entre backend y frontend.
 * Fuente única de verdad para enums de dominio.
 */

// ─── Roles y permisos ────────────────────────────────────────────────
export enum Rol {
  ADMIN = 'ADMIN',
  TRABAJADOR = 'TRABAJADOR',
}

// ─── Reloj / Clock ───────────────────────────────────────────────────
export enum AccionTiempo {
  SEO = 'SEO',
  WEB = 'WEB',
  RRSS = 'RRSS',
  DISENO = 'DISENO',
  INFORMES = 'INFORMES',
  SEO_LOCAL = 'SEO_LOCAL',
  ADS = 'ADS',
  ADMINISTRACION = 'ADMINISTRACION',
  ESTRATEGIA = 'ESTRATEGIA',
  EMAIL_MARKETING = 'EMAIL_MARKETING',
}

/** Etiquetas legibles para la UI. */
export const ACCION_TIEMPO_LABEL: Record<AccionTiempo, string> = {
  [AccionTiempo.SEO]: 'SEO',
  [AccionTiempo.WEB]: 'Web',
  [AccionTiempo.RRSS]: 'RRSS',
  [AccionTiempo.DISENO]: 'Diseño',
  [AccionTiempo.INFORMES]: 'Informes',
  [AccionTiempo.SEO_LOCAL]: 'SEO Local',
  [AccionTiempo.ADS]: 'Ads',
  [AccionTiempo.ADMINISTRACION]: 'Administración',
  [AccionTiempo.ESTRATEGIA]: 'Estrategia',
  [AccionTiempo.EMAIL_MARKETING]: 'Email Marketing',
};

// ─── Clientes / Tableros ─────────────────────────────────────────────
export enum TipoTablero {
  INFORMACION = 'INFORMACION',
  ADS = 'ADS',
  SEO = 'SEO',
  WEB = 'WEB',
  DISENO = 'DISENO',
  REDES = 'REDES',
  ESTRATEGICO = 'ESTRATEGICO',
  AUDIOVISUAL = 'AUDIOVISUAL',
}

export enum EstadoTarjeta {
  PENDIENTE = 'PENDIENTE',
  EN_CURSO = 'EN_CURSO',
  HECHO = 'HECHO',
}

// ─── Potenciales / Presupuestos ──────────────────────────────────────
export enum EstadoPotencial {
  NUEVO = 'NUEVO',
  CONTACTADO = 'CONTACTADO',
  PRESUPUESTO_ENVIADO = 'PRESUPUESTO_ENVIADO',
  ACEPTADO = 'ACEPTADO',
  RECHAZADO = 'RECHAZADO',
}

export enum EstadoPresupuesto {
  BORRADOR = 'BORRADOR',
  ENVIADO = 'ENVIADO',
  ACEPTADO = 'ACEPTADO',
  RECHAZADO = 'RECHAZADO',
}

// ─── Notificaciones ──────────────────────────────────────────────────
export enum TipoNotificacion {
  TARJETA_ASIGNADA = 'TARJETA_ASIGNADA',
  POTENCIAL = 'POTENCIAL',
  REUNION = 'REUNION',
}

// ─── DTOs compartidos (formas de payload de la API) ──────────────────
export interface UsuarioPublico {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface AuthResponse {
  accessToken: string;
  usuario: UsuarioPublico;
}
