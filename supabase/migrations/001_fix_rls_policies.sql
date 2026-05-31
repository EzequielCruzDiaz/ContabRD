-- ============================================================
-- Migration 001: Fix RLS policies + add declaraciones table
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. empresas: add missing RLS policies ──────────────────
CREATE POLICY "usuarios ven su empresa" ON empresas
  FOR SELECT USING (
    id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "admin actualiza su empresa" ON empresas
  FOR UPDATE USING (
    id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

-- ── 2. profiles: allow viewing team members ────────────────
CREATE POLICY "usuarios ven equipo de su empresa" ON profiles
  FOR SELECT USING (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

-- ── 3. declaraciones table ─────────────────────────────────
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
