-- ── Tabla de incidentes (errores detectados por el Error Monitor) ─────────────
CREATE TABLE IF NOT EXISTS incidentes (
  id               BIGSERIAL PRIMARY KEY,
  created_at       TIMESTAMPTZ DEFAULT now(),
  workflow_id      TEXT,
  workflow_name    TEXT,
  exec_id          TEXT,
  node_name        TEXT,
  error_message    TEXT,
  cliente_telefono TEXT,
  estado           TEXT DEFAULT 'pendiente',  -- pendiente | en_revision | resuelto
  tipo_fix         TEXT,                       -- immediate | maintenance
  fix_descripcion  TEXT,
  fix_aplicado_at  TIMESTAMPTZ,
  programado_para  TIMESTAMPTZ,
  fix_resultado    TEXT
);

-- ── Tabla de log de conversaciones (cada mensaje procesado por n8n) ──────────
CREATE TABLE IF NOT EXISTS conversaciones_log (
  id               BIGSERIAL PRIMARY KEY,
  created_at       TIMESTAMPTZ DEFAULT now(),
  workflow_id      TEXT,
  workflow_name    TEXT,
  exec_id          TEXT UNIQUE,
  cliente_telefono TEXT,
  tipo_mensaje     TEXT,   -- texto | audio | imagen
  estado           TEXT,   -- success | error
  duracion_ms      INT
);

-- ── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_incidentes_estado     ON incidentes(estado);
CREATE INDEX IF NOT EXISTS idx_incidentes_created_at ON incidentes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_created_at       ON conversaciones_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_workflow          ON conversaciones_log(workflow_id);

-- ── Activar Realtime en ambas tablas ─────────────────────────────────────────
-- En Supabase Dashboard → Table Editor → cada tabla → Enable Realtime
-- O ejecutar:
ALTER PUBLICATION supabase_realtime ADD TABLE incidentes;
ALTER PUBLICATION supabase_realtime ADD TABLE conversaciones_log;
