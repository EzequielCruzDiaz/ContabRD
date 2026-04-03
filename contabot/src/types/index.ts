export type UserRole = "admin" | "contador" | "viewer";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  empresa_id: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  rnc: string;
  regimen_fiscal: "ordinario" | "simplificado";
  created_at: string;
}

export type FacturaEstado = "pendiente" | "procesada" | "rechazada";
export type FacturaTipo = "B01" | "B02" | "B14" | "B15";

export interface Factura {
  id: string;
  empresa_id: string;
  ncf: string;
  tipo_ncf: FacturaTipo;
  proveedor: string;
  rnc_proveedor: string;
  fecha: string;
  monto: number;
  itbis: number;
  monto_neto: number;
  estado: FacturaEstado;
  imagen_url?: string;
  created_at: string;
}

export type MessageRole = "user" | "assistant";

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ChatSession {
  id: string;
  empresa_id: string;
  messages: Message[];
  created_at: string;
}
