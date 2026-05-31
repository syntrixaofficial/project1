CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  workflow_name text NOT NULL,
  category text,
  requester text,
  status text NOT NULL DEFAULT 'INFO',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workflow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  workflow_name text NOT NULL,
  status text NOT NULL DEFAULT 'INFO',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.observability_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  category text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workflow_state (
  request_id text PRIMARY KEY,
  workflow_name text,
  category text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lifecycle_state (
  request_id text PRIMARY KEY,
  workflow_name text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.working_memory (
  request_id text PRIMARY KEY,
  category text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.long_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  category text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.private_memory (
  request_id text PRIMARY KEY,
  category text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shared_memory (
  category text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.identity_context (
  request_id text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.knowledge_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  title text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  requester text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_request_id_idx ON public.audit_logs (request_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS workflow_logs_request_id_idx ON public.workflow_logs (request_id);
CREATE INDEX IF NOT EXISTS observability_events_created_at_idx ON public.observability_events (created_at DESC);
CREATE INDEX IF NOT EXISTS long_memory_category_idx ON public.long_memory (category);
CREATE INDEX IF NOT EXISTS knowledge_index_category_idx ON public.knowledge_index (category);
