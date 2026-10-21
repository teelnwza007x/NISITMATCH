-- NISIT MATCH / Opn Live Premium preflight (READ ONLY)
-- Run in Supabase SQL Editor and share results before enabling real-money fulfillment.
-- No data or schema is changed by this file.

-- 1. Premium table constraints, including status/provider/plan restrictions
select c.conrelid::regclass::text as table_name,c.conname as constraint_name,
       pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.conrelid in ('public.premium_subscriptions'::regclass,
                     'public.premium_payments'::regclass,
                     'public.opn_promptpay_payments'::regclass)
order by 1,2;

-- 2. Indexes and uniqueness / upsert conflict targets
select tablename,indexname,indexdef
from pg_indexes
where schemaname='public' and tablename in
 ('premium_subscriptions','premium_payments','opn_promptpay_payments')
order by tablename,indexname;

-- 3. Premium-related functions (names, signatures and definitions)
select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and (p.proname ilike '%premium%' or p.proname ilike '%stripe%')
order by p.proname;

-- 4. Triggers that could modify premium state
select event_object_table as table_name,trigger_name,
       action_timing,event_manipulation,action_statement
from information_schema.triggers
where event_object_schema='public'
  and event_object_table in ('premium_subscriptions','premium_payments')
order by event_object_table,trigger_name;

-- 5. Column defaults and nullability
select table_name,column_name,is_nullable,column_default
from information_schema.columns
where table_schema='public' and table_name in
 ('premium_subscriptions','premium_payments')
order by table_name,ordinal_position;
