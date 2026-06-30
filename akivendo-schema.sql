-- ═══════════════════════════════════════════════════════════════════════════════
--  akivendo — Schema SQL completo para Supabase
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
  CREATE TYPE rol_usuario   AS ENUM ('comprador','vendedor','admin');
  CREATE TYPE estado_pedido AS ENUM ('pendiente','confirmado','en_camino','entregado','cancelado');
  CREATE TYPE nivel_lealtad AS ENUM ('frecuente','oro','platinum','diamante');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── usuarios ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuarios (
  id                UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre            TEXT         NOT NULL DEFAULT 'Usuario',
  email             TEXT,
  telefono          TEXT,
  rol               rol_usuario  NOT NULL DEFAULT 'comprador',
  puntos_acumulados INTEGER      NOT NULL DEFAULT 0 CHECK (puntos_acumulados >= 0),
  nivel             nivel_lealtad NOT NULL DEFAULT 'frecuente',
  avatar_url        TEXT,
  activo            BOOLEAN      NOT NULL DEFAULT true,
  creado_en         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Trigger nivel
CREATE OR REPLACE FUNCTION actualizar_nivel_akivendo() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.puntos_acumulados >= 5000 THEN NEW.nivel := 'diamante';
  ELSIF NEW.puntos_acumulados >= 2000 THEN NEW.nivel := 'platinum';
  ELSIF NEW.puntos_acumulados >= 500  THEN NEW.nivel := 'oro';
  ELSE NEW.nivel := 'frecuente'; END IF;
  NEW.actualizado_en := NOW(); RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nivel ON public.usuarios;
CREATE TRIGGER trigger_nivel BEFORE UPDATE OF puntos_acumulados ON public.usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_nivel_akivendo();

-- Trigger crear perfil
CREATE OR REPLACE FUNCTION crear_perfil_akivendo() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(COALESCE(NEW.email,'usuario'), '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'rol')::rol_usuario, 'comprador')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION crear_perfil_akivendo();

-- ─── categorias_vendedor ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categorias_vendedor (
  id          UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT  NOT NULL UNIQUE,
  emoji       TEXT  NOT NULL DEFAULT '🏪',
  descripcion TEXT
);

INSERT INTO public.categorias_vendedor (nombre, emoji, descripcion) VALUES
  ('Ambulante',       '🚶', 'Vendedor que se mueve por la zona'),
  ('Zapatería',       '👟', 'Calzado y reparación de zapatos'),
  ('Costura y Moda',  '🧵', 'Costureras, modistas y arreglos'),
  ('Tienda de Barrio','🏪', 'Tiendas locales del vecindario'),
  ('Mercado Comunal', '🛒', 'Puestos de mercados comunitarios'),
  ('Comida y Bebidas','🍽️', 'Comida casera, pupusas, bebidas'),
  ('Otro Negocio',    '💼', 'Otros tipos de comercio local')
ON CONFLICT (nombre) DO NOTHING;

-- ─── tiendas ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tiendas (
  id               UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendedor_id      UUID             NOT NULL REFERENCES public.usuarios(id),
  nombre           TEXT             NOT NULL,
  descripcion      TEXT,
  categoria_id     TEXT             NOT NULL DEFAULT 'ambulante',
  whatsapp         TEXT             NOT NULL,
  logo_url         TEXT,
  lat_actual       DOUBLE PRECISION,
  lng_actual       DOUBLE PRECISION,
  ultima_ubicacion TIMESTAMPTZ,
  activa           BOOLEAN          NOT NULL DEFAULT true,
  es_ambulante     BOOLEAN          NOT NULL DEFAULT true,
  ciudad           TEXT,
  horario          TEXT,
  creado_en        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiendas_activas ON public.tiendas (activa, lat_actual, lng_actual) WHERE activa = true;

-- ─── productos ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.productos (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id   UUID         REFERENCES public.tiendas(id) ON DELETE CASCADE,
  nombre      TEXT         NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(8,2) NOT NULL CHECK (precio > 0),
  imagen_url  TEXT,
  activo      BOOLEAN      NOT NULL DEFAULT true,
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── pedidos ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  comprador_id      UUID          NOT NULL REFERENCES public.usuarios(id),
  tienda_id         UUID          NOT NULL REFERENCES public.tiendas(id),
  estado            estado_pedido NOT NULL DEFAULT 'pendiente',
  total             NUMERIC(8,2)  NOT NULL CHECK (total > 0),
  pasaje            TEXT,
  numero_casa       TEXT,
  lat_entrega       DOUBLE PRECISION,
  lng_entrega       DOUBLE PRECISION,
  notas             TEXT,
  puntos_ganados    INTEGER       NOT NULL DEFAULT 0,
  whatsapp_enviado  BOOLEAN       NOT NULL DEFAULT false,
  creado_en         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_tienda    ON public.pedidos (tienda_id, estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_comprador ON public.pedidos (comprador_id, creado_en DESC);

-- Trigger puntos
CREATE OR REPLACE FUNCTION calcular_puntos_akivendo() RETURNS TRIGGER AS $$
DECLARE v INTEGER;
BEGIN
  IF NEW.estado = 'entregado' AND OLD.estado <> 'entregado' THEN
    v := GREATEST(1, FLOOR(NEW.total * 5)::INTEGER);
    NEW.puntos_ganados := v; NEW.actualizado_en := NOW();
    UPDATE public.usuarios SET puntos_acumulados = puntos_acumulados + v, actualizado_en = NOW() WHERE id = NEW.comprador_id;
    INSERT INTO public.movimientos_puntos (usuario_id, pedido_id, puntos, concepto) VALUES (NEW.comprador_id, NEW.id, v, 'Compra confirmada — $' || NEW.total::TEXT) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_puntos ON public.pedidos;
CREATE TRIGGER trigger_puntos BEFORE UPDATE OF estado ON public.pedidos FOR EACH ROW EXECUTE FUNCTION calcular_puntos_akivendo();

-- ─── detalle_pedido ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.detalle_pedido (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id       UUID         NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_id     UUID         NOT NULL REFERENCES public.productos(id),
  cantidad        INTEGER      NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(8,2) NOT NULL,
  subtotal        NUMERIC(8,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- ─── movimientos_puntos ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.movimientos_puntos (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID        NOT NULL REFERENCES public.usuarios(id),
  pedido_id  UUID        REFERENCES public.pedidos(id),
  puntos     INTEGER     NOT NULL,
  concepto   TEXT        NOT NULL,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_puntos_usuario ON public.movimientos_puntos (usuario_id, creado_en DESC);

-- ─── rifas ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rifas (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo            TEXT        NOT NULL,
  descripcion       TEXT,
  imagen_url        TEXT,
  puntos_requeridos INTEGER     NOT NULL DEFAULT 100,
  fecha_sorteo      DATE        NOT NULL,
  activa            BOOLEAN     NOT NULL DEFAULT true,
  ganador_id        UUID        REFERENCES public.usuarios(id),
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.participaciones_rifas (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  rifa_id    UUID        NOT NULL REFERENCES public.rifas(id),
  usuario_id UUID        NOT NULL REFERENCES public.usuarios(id),
  tickets    INTEGER     NOT NULL DEFAULT 1,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rifa_id, usuario_id)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.usuarios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_vendedor  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiendas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedido       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_puntos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rifas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participaciones_rifas ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION es_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- usuarios
DROP POLICY IF EXISTS "u_sel" ON public.usuarios;
CREATE POLICY "u_sel" ON public.usuarios FOR SELECT TO authenticated USING (id = auth.uid() OR es_admin());
DROP POLICY IF EXISTS "u_upd" ON public.usuarios;
CREATE POLICY "u_upd" ON public.usuarios FOR UPDATE TO authenticated USING (id = auth.uid());

-- categorias (lectura libre)
DROP POLICY IF EXISTS "cat_sel" ON public.categorias_vendedor;
CREATE POLICY "cat_sel" ON public.categorias_vendedor FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cat_all" ON public.categorias_vendedor;
CREATE POLICY "cat_all" ON public.categorias_vendedor FOR ALL TO authenticated USING (es_admin());

-- tiendas
DROP POLICY IF EXISTS "t_sel" ON public.tiendas;
CREATE POLICY "t_sel" ON public.tiendas FOR SELECT TO authenticated USING (activa = true OR vendedor_id = auth.uid() OR es_admin());
DROP POLICY IF EXISTS "t_ins" ON public.tiendas;
CREATE POLICY "t_ins" ON public.tiendas FOR INSERT TO authenticated WITH CHECK (vendedor_id = auth.uid());
DROP POLICY IF EXISTS "t_upd" ON public.tiendas;
CREATE POLICY "t_upd" ON public.tiendas FOR UPDATE TO authenticated USING (vendedor_id = auth.uid() OR es_admin());

-- productos
DROP POLICY IF EXISTS "p_sel" ON public.productos;
CREATE POLICY "p_sel" ON public.productos FOR SELECT TO authenticated USING (activo = true OR es_admin());
DROP POLICY IF EXISTS "p_ins" ON public.productos;
CREATE POLICY "p_ins" ON public.productos FOR INSERT TO authenticated
  WITH CHECK (tienda_id IN (SELECT id FROM public.tiendas WHERE vendedor_id = auth.uid()));
DROP POLICY IF EXISTS "p_upd" ON public.productos;
CREATE POLICY "p_upd" ON public.productos FOR UPDATE TO authenticated
  USING (tienda_id IN (SELECT id FROM public.tiendas WHERE vendedor_id = auth.uid()) OR es_admin());
DROP POLICY IF EXISTS "p_del" ON public.productos;
CREATE POLICY "p_del" ON public.productos FOR DELETE TO authenticated
  USING (tienda_id IN (SELECT id FROM public.tiendas WHERE vendedor_id = auth.uid()) OR es_admin());

-- pedidos
DROP POLICY IF EXISTS "ped_sel" ON public.pedidos;
CREATE POLICY "ped_sel" ON public.pedidos FOR SELECT TO authenticated
  USING (comprador_id = auth.uid() OR tienda_id IN (SELECT id FROM public.tiendas WHERE vendedor_id = auth.uid()) OR es_admin());
DROP POLICY IF EXISTS "ped_ins" ON public.pedidos;
CREATE POLICY "ped_ins" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (comprador_id = auth.uid());
DROP POLICY IF EXISTS "ped_upd" ON public.pedidos;
CREATE POLICY "ped_upd" ON public.pedidos FOR UPDATE TO authenticated
  USING (comprador_id = auth.uid() OR tienda_id IN (SELECT id FROM public.tiendas WHERE vendedor_id = auth.uid()) OR es_admin());

-- detalle
DROP POLICY IF EXISTS "det_sel" ON public.detalle_pedido;
CREATE POLICY "det_sel" ON public.detalle_pedido FOR SELECT TO authenticated
  USING (pedido_id IN (SELECT id FROM public.pedidos WHERE comprador_id = auth.uid() OR tienda_id IN (SELECT id FROM public.tiendas WHERE vendedor_id = auth.uid())) OR es_admin());
DROP POLICY IF EXISTS "det_ins" ON public.detalle_pedido;
CREATE POLICY "det_ins" ON public.detalle_pedido FOR INSERT TO authenticated
  WITH CHECK (pedido_id IN (SELECT id FROM public.pedidos WHERE comprador_id = auth.uid()));

-- puntos
DROP POLICY IF EXISTS "pts_sel" ON public.movimientos_puntos;
CREATE POLICY "pts_sel" ON public.movimientos_puntos FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR es_admin());

-- rifas
DROP POLICY IF EXISTS "rif_sel" ON public.rifas;
CREATE POLICY "rif_sel" ON public.rifas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "rif_all" ON public.rifas;
CREATE POLICY "rif_all" ON public.rifas FOR ALL TO authenticated USING (es_admin());

-- participaciones
DROP POLICY IF EXISTS "par_sel" ON public.participaciones_rifas;
CREATE POLICY "par_sel" ON public.participaciones_rifas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "par_ins" ON public.participaciones_rifas;
CREATE POLICY "par_ins" ON public.participaciones_rifas FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "par_upd" ON public.participaciones_rifas;
CREATE POLICY "par_upd" ON public.participaciones_rifas FOR UPDATE TO authenticated USING (usuario_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- REALTIME
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.tiendas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usuarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.movimientos_puntos;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STORAGE
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public) VALUES
  ('logos-tiendas',  'logos-tiendas',  true),
  ('fotos-productos','fotos-productos', true),
  ('rifas-imgs',     'rifas-imgs',      true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "logos_sel"  ON storage.objects;
CREATE POLICY "logos_sel"  ON storage.objects FOR SELECT USING (bucket_id IN ('logos-tiendas','fotos-productos','rifas-imgs'));
DROP POLICY IF EXISTS "logos_ins"  ON storage.objects;
CREATE POLICY "logos_ins"  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('logos-tiendas','fotos-productos'));
DROP POLICY IF EXISTS "rifas_ins"  ON storage.objects;
CREATE POLICY "rifas_ins"  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'rifas-imgs' AND es_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- PRIMER ADMIN: después de registrarte ejecutá:
-- UPDATE public.usuarios SET rol = 'admin' WHERE email = 'tu@email.com';
-- ═══════════════════════════════════════════════════════════════════════════════
