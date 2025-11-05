-- Este archivo permite crear la base de datos desde cero con la estructura actual.

BEGIN;

-- entidades
CREATE TABLE IF NOT EXISTS "entidades" (
  id serial PRIMARY KEY,
  nombre varchar
);

-- estado_proceso
CREATE TABLE IF NOT EXISTS "estado_proceso" (
  id serial PRIMARY KEY,
  nombre varchar
);

-- tipo_proceso
CREATE TABLE IF NOT EXISTS "tipo_proceso" (
  id serial PRIMARY KEY,
  nombre varchar
);

-- procesos
CREATE TABLE IF NOT EXISTS "procesos" (
  id serial PRIMARY KEY,
  objeto text,
  entidad_id integer REFERENCES entidades(id),
  anticipo smallint,
  mipyme boolean,
  estado_id integer REFERENCES estado_proceso(id),
  tipo_proceso_id integer REFERENCES tipo_proceso(id),
  codigo_link varchar
);

-- tipo_fecha_proceso
CREATE TABLE IF NOT EXISTS "tipo_fecha_proceso" (
  id serial PRIMARY KEY,
  nombre varchar
);

-- fecha_proceso (incluye la columna `importante`)
CREATE TABLE IF NOT EXISTS "fecha_proceso" (
  id serial PRIMARY KEY,
  proceso_id integer REFERENCES procesos(id),
  tipo_fecha_proceso_id integer REFERENCES tipo_fecha_proceso(id),
  fecha timestamp,
  importante boolean NOT NULL DEFAULT false
);

-- índice único parcial para garantizar una sola fecha "importante" por proceso
CREATE UNIQUE INDEX IF NOT EXISTS ux_fecha_proceso_unica_importante
ON fecha_proceso (proceso_id)
WHERE importante = true;

-- lotes
CREATE TABLE IF NOT EXISTS "lotes" (
  id serial PRIMARY KEY,
  proceso_id integer REFERENCES procesos(id),
  valor decimal(15,2),
  poliza decimal(15,2),
  poliza_real boolean
);

-- consorcios
CREATE TABLE IF NOT EXISTS "consorcios" (
  id serial PRIMARY KEY,
  nombre varchar
);

-- empresas
CREATE TABLE IF NOT EXISTS "empresas" (
  id serial PRIMARY KEY,
  nombre varchar
);

-- ofertas
CREATE TABLE IF NOT EXISTS "ofertas" (
  id serial PRIMARY KEY,
  lote_id integer REFERENCES lotes(id),
  consorcio_id integer REFERENCES consorcios(id)
);

-- consorcio_empresa
CREATE TABLE IF NOT EXISTS "consorcio_empresa" (
  id serial PRIMARY KEY,
  consorcio_id integer REFERENCES consorcios(id),
  empresa_id integer REFERENCES empresas(id)
);

COMMIT;
