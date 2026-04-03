-- ============================================================
-- ContaBot – Esquema de base de datos
-- República Dominicana – DGII compliance
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- Empresas
-- ============================================================
create table empresas (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  rnc         varchar(11) not null unique,
  regimen_fiscal text not null default 'ordinario'
                  check (regimen_fiscal in ('ordinario', 'simplificado')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Perfiles de usuario
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  name        text,
  role        text not null default 'contador'
                  check (role in ('admin', 'contador', 'viewer')),
  empresa_id  uuid references empresas(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Trigger: crear perfil al registrar usuario
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- Facturas
-- ============================================================
create table facturas (
  id              uuid primary key default uuid_generate_v4(),
  empresa_id      uuid not null references empresas(id) on delete cascade,
  ncf             varchar(19) not null,
  tipo_ncf        varchar(3) not null check (tipo_ncf in ('B01','B02','B14','B15','B16','B17')),
  proveedor       text not null,
  rnc_proveedor   varchar(11),
  fecha           date not null,
  monto           numeric(14,2) not null check (monto >= 0),
  itbis           numeric(14,2) not null default 0 check (itbis >= 0),
  monto_neto      numeric(14,2) generated always as (monto + itbis) stored,
  estado          text not null default 'pendiente'
                      check (estado in ('pendiente','procesada','rechazada')),
  imagen_url      text,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index idx_facturas_empresa on facturas(empresa_id);
create index idx_facturas_fecha on facturas(fecha);
create index idx_facturas_ncf on facturas(ncf);

-- ============================================================
-- Sesiones de chat
-- ============================================================
create table chat_sessions (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,
  messages    jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table empresas    enable row level security;
alter table profiles    enable row level security;
alter table facturas    enable row level security;
alter table chat_sessions enable row level security;

-- Profiles: cada usuario ve solo su perfil
create policy "users_own_profile" on profiles
  for all using (auth.uid() = id);

-- Facturas: usuarios ven solo las de su empresa
create policy "empresa_facturas" on facturas
  for all using (
    empresa_id = (select empresa_id from profiles where id = auth.uid())
  );

-- Chat sessions: igual que facturas
create policy "empresa_chat" on chat_sessions
  for all using (
    empresa_id = (select empresa_id from profiles where id = auth.uid())
  );
