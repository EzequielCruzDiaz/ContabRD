-- ============================================================
-- ContabRD – Esquema de base de datos
-- República Dominicana – DGII compliance
-- ============================================================

CREATE TABLE empresas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           text NOT NULL,
  rnc              text,
  tipo             text CHECK (tipo IN ('fisica', 'juridica')),
  direccion        text,
  mes_inicio       integer DEFAULT 1 CHECK (mes_inicio BETWEEN 1 AND 12),
  moneda           text DEFAULT 'DOP' CHECK (moneda IN ('DOP', 'USD')),
  plan             text DEFAULT 'basico' CHECK (plan IN ('basico', 'pro', 'enterprise')),
  facturas_limite  integer DEFAULT 100,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id  uuid REFERENCES empresas(id),
  nombre      text,
  rol         text DEFAULT 'usuario' CHECK (rol IN ('admin', 'contador', 'usuario')),
  created_at  timestamptz DEFAULT now()
);

-- Trigger: crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

CREATE TABLE facturas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       uuid REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id       uuid REFERENCES profiles(id),
  proveedor        text,
  rnc_proveedor    text,
  ncf              text,
  tipo_ncf         text,
  fecha_factura    date,
  subtotal         numeric(12,2),
  itbis            numeric(12,2),
  total            numeric(12,2),
  retencion_itbis  numeric(12,2),
  retencion_isr    numeric(12,2),
  estado           text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'registrado', 'error')),
  error_mensaje    text,
  archivo_url      text,
  datos_raw        jsonb,
  asiento_contable text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_facturas_empresa  ON facturas(empresa_id);
CREATE INDEX idx_facturas_fecha    ON facturas(fecha_factura);
CREATE INDEX idx_facturas_ncf      ON facturas(ncf);

CREATE TABLE chat_mensajes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id  uuid REFERENCES profiles(id),
  rol         text CHECK (rol IN ('user', 'assistant')),
  contenido   text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE empresas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios ven sus facturas" ON facturas
  FOR ALL USING (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "usuarios ven su historial" ON chat_mensajes
  FOR ALL USING (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

-- Perfil propio
CREATE POLICY "usuarios ven su perfil" ON profiles
  FOR ALL USING (id = auth.uid());

-- Ver equipo de la misma empresa (para /empresa)
CREATE POLICY "usuarios ven equipo de su empresa" ON profiles
  FOR SELECT USING (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

-- Empresa: leer y actualizar la propia
CREATE POLICY "usuarios ven su empresa" ON empresas
  FOR SELECT USING (
    id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "admin actualiza su empresa" ON empresas
  FOR UPDATE USING (
    id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- Tabla: declaraciones (DGII compliance tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS declaraciones (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id           uuid REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id           uuid REFERENCES profiles(id),
  tipo                 text NOT NULL CHECK (tipo IN ('IT-1','IR-17','IR-2','606','607','TSS')),
  periodo_mes          integer CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio         integer,
  fecha_envio          date,
  fecha_vencimiento    date,
  estado               text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviada','aceptada','rechazada')),
  numero_confirmacion  text,
  monto_declarado      numeric(14,2),
  notas                text,
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_declaraciones_empresa ON declaraciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_declaraciones_venc    ON declaraciones(fecha_vencimiento);

ALTER TABLE declaraciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios ven sus declaraciones" ON declaraciones
  FOR ALL USING (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

-- Storage bucket para facturas (ejecutar desde el dashboard de Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('facturas', 'facturas', false);
