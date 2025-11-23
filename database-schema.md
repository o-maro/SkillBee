-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE disputes (
  dispute_id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  client_id uuid NOT NULL,
  tasker_id uuid NOT NULL,
  issue_type text,
  description text,
  status text DEFAULT 'open'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT disputes_pkey PRIMARY KEY (dispute_id),
  CONSTRAINT disputes_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(task_id),
  CONSTRAINT disputes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id),
  CONSTRAINT disputes_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.users(id)
);
CREATE TABLE ratings (
  rating_id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  tasker_id uuid NOT NULL,
  client_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  review text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ratings_pkey PRIMARY KEY (rating_id),
  CONSTRAINT ratings_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(task_id),
  CONSTRAINT ratings_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.users(id),
  CONSTRAINT ratings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id)
);
CREATE TABLE services (
  id integer NOT NULL DEFAULT nextval('services_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  CONSTRAINT services_pkey PRIMARY KEY (id)
);
CREATE TABLE taskers (
  tasker_id uuid NOT NULL,
  services_offered ARRAY DEFAULT ARRAY[]::text[],
  hourly_rate numeric,
  rating numeric DEFAULT 0,
  completed_tasks integer DEFAULT 0,
  is_available boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT taskers_pkey PRIMARY KEY (tasker_id),
  CONSTRAINT taskers_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.users(id)
);
CREATE TABLE tasks (
  task_id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  tasker_id uuid,
  service_id integer NOT NULL,
  description text,
  budget numeric,
  escrow_amount numeric DEFAULT 0,
  escrow_released boolean DEFAULT false,
  latitude double precision,
  longitude double precision,
  preferred_time timestamp with time zone,
  status USER-DEFINED DEFAULT 'pending'::task_status_enum,
  created_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT tasks_pkey PRIMARY KEY (task_id),
  CONSTRAINT tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id),
  CONSTRAINT tasks_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.users(id),
  CONSTRAINT tasks_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE transactions (
  transaction_id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  type USER-DEFINED NOT NULL,
  meta jsonb,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id),
  CONSTRAINT transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(wallet_id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE users (
  id uuid NOT NULL,
  full_name text,
  phone_number text,
  email text,
  role USER-DEFINED NOT NULL DEFAULT 'client'::role_enum,
  profile_url text,
  bio text,
  latitude double precision,
  longitude double precision,
  verified boolean DEFAULT false,
  verified_by_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  avatar_url text,
  address text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE wallets (
  wallet_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric DEFAULT 0,
  CONSTRAINT wallets_pkey PRIMARY KEY (wallet_id),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);