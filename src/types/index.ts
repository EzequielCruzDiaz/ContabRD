export type Plan = "basico" | "pro" | "enterprise";
export type RolUsuario = "admin" | "contador" | "usuario";
export type EstadoFactura = "pendiente" | "registrado" | "error";
export type EstadoDeclaracion = "pendiente" | "enviada" | "aceptada" | "rechazada";
export type TipoDeclaracion = "IT-1" | "IR-17" | "IR-2" | "606" | "607" | "TSS";

export interface AsientoLinea {
  cuenta: string;
  debito: number | null;
  credito: number | null;
}

export interface DatosFacturaExtraidos {
  rnc_proveedor?: string;
  ncf?: string;
  proveedor?: string;
  fecha_factura?: string;
  subtotal?: number;
  itbis?: number;
  total?: number;
  asiento_contable?: AsientoLinea[];
}

export interface Empresa {
  id: string;
  nombre: string;
  rnc?: string;
  plan: Plan;
  facturas_limite: number;
  created_at: string;
}

export interface Profile {
  id: string;
  empresa_id: string;
  nombre: string;
  rol: RolUsuario;
  created_at: string;
}

export interface Factura {
  id: string;
  empresa_id: string;
  usuario_id: string;
  proveedor?: string;
  rnc_proveedor?: string;
  ncf?: string;
  tipo_ncf?: string;
  fecha_factura?: string;
  subtotal?: number;
  itbis?: number;
  total?: number;
  retencion_itbis?: number;
  retencion_isr?: number;
  estado: EstadoFactura;
  error_mensaje?: string;
  archivo_url?: string;
  asiento_contable?: string;
  created_at: string;
}

export interface ChatMensaje {
  id: string;
  rol: "user" | "assistant";
  contenido: string;
  created_at: string;
}

export interface Declaracion {
  id: string;
  empresa_id: string;
  usuario_id: string;
  tipo: string;
  periodo_mes: number | null;
  periodo_anio: number | null;
  fecha_envio: string | null;
  fecha_vencimiento: string | null;
  estado: EstadoDeclaracion;
  numero_confirmacion: string | null;
  monto_declarado: number | null;
  notas: string | null;
  created_at: string;
}

// Alias para compatibilidad con componentes de chat
export type Message = {
  role: "user" | "assistant";
  content: string;
};
