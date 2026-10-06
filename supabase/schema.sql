-- ECE careers demo schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null default 'Customer Support',
  location text not null,
  employment_type text not null default 'Full time',
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  location text not null,
  experience text not null,
  note text not null default '',
  status text not null default 'New' check (status in ('New','Reviewing','Shortlisted','Declined')),
  created_at timestamptz not null default now()
);

alter table public.jobs enable row level security;
alter table public.applications enable row level security;

-- A trusted database check: a valid session alone is not enough; the Gmail identity
-- must have completed Supabase email confirmation before a candidate can submit.
create or replace function public.is_verified_gmail_applicant()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
      and lower(u.email) like '%@gmail.com'
      and lower(u.email) = lower((select auth.jwt() ->> 'email'))
  );
$$;
revoke all on function public.is_verified_gmail_applicant() from public;
grant execute on function public.is_verified_gmail_applicant() to authenticated;

drop policy if exists "Anyone can view active jobs" on public.jobs;
create policy "Anyone can view active jobs" on public.jobs for select using (is_active = true or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can manage jobs" on public.jobs;
create policy "Admins can manage jobs" on public.jobs for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Verified Gmail users can submit applications" on public.applications;
create policy "Verified Gmail users can submit applications" on public.applications for insert to authenticated
with check (
  auth.uid() = user_id
  and lower(email) = lower(auth.jwt() ->> 'email')
  and lower(email) like '%@gmail.com'
  and public.is_verified_gmail_applicant()
);
drop policy if exists "Applicants can read their own applications" on public.applications;
create policy "Applicants can read their own applications" on public.applications for select to authenticated
using (auth.uid() = user_id);
drop policy if exists "ECE admins can view all applications" on public.applications;
create policy "ECE admins can view all applications" on public.applications for select to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "ECE admins can update applications" on public.applications;
create policy "ECE admins can update applications" on public.applications for update to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Demo openings only. Replace or remove these and use approved, live vacancies before launch.
insert into public.jobs (title, department, location, employment_type, description)
select v.title, v.department, v.location, v.employment_type, v.description
from (values
  ('Customer Experience Associate','Customer Support','Dumaguete','Full time','Help customers get clear, thoughtful answers across phone, chat, or email.'),
  ('Chat Support Representative','Customer Support','Makati','Full time','Resolve customer questions through responsive, friendly digital conversations.'),
  ('Quality Assurance Analyst','Operations','Dumaguete','Full time','Review customer interactions and turn feedback into better service.')
) as v(title,department,location,employment_type,description)
where not exists (select 1 from public.jobs);
