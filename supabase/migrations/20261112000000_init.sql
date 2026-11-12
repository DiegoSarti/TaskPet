-- TaskPet: esquema inicial do lado social.
-- As tarefas e o histórico ficam no aparelho; o servidor guarda só o que os amigos veem:
-- perfil, "foto" do pet (pet_snapshots), amizades e incentivos.

create extension if not exists pgcrypto;

-- Perfis --------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null,
  friend_code text not null unique default upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  created_at timestamptz not null default now()
);

-- O perfil é criado automaticamente no cadastro, com os dados enviados em signUp(options.data).
-- Assim funciona mesmo quando o Supabase exige confirmação de e-mail (sem sessão logo após o cadastro).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, display_name)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), new.raw_user_meta_data ->> 'username')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Permite checar se o nome de usuário está livre antes do cadastro.
create or replace function public.username_available(name text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from profiles where username = lower(name));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- Amizades ------------------------------------------------------------------
create table public.friendships (
  requester uuid not null references public.profiles (id) on delete cascade,
  addressee uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester = a and addressee = b) or (requester = b and addressee = a))
  );
$$;

-- "Foto" pública do pet -----------------------------------------------------
create table public.pet_snapshots (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  pet_name text not null,
  species text not null,
  stage text not null,
  mood text not null,
  aura text not null,
  variant text not null,
  xp integer not null default 0,
  streak integer not null default 0,
  weekly_xp integer not null default 0,
  week_start date not null,
  pets_lost integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Incentivos ----------------------------------------------------------------
create table public.cheers (
  id bigint generated always as identity primary key,
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (emoji in ('👏', '💪', '🔥', '❤️', '⭐')),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index cheers_to_user_idx on public.cheers (to_user, created_at desc);

-- Segurança (RLS) -----------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.pet_snapshots enable row level security;
alter table public.cheers enable row level security;

-- Perfis são visíveis para usuários logados (necessário para buscar amigos pelo nome).
create policy "perfis visiveis" on public.profiles for select to authenticated using (true);
create policy "cria o proprio perfil" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "edita o proprio perfil" on public.profiles for update to authenticated using (id = auth.uid());

create policy "ve as proprias amizades" on public.friendships for select to authenticated
  using (auth.uid() in (requester, addressee));
create policy "envia pedido" on public.friendships for insert to authenticated
  with check (requester = auth.uid() and status = 'pending');
create policy "aceita pedido" on public.friendships for update to authenticated
  using (addressee = auth.uid()) with check (status = 'accepted');
create policy "desfaz amizade" on public.friendships for delete to authenticated
  using (auth.uid() in (requester, addressee));

create policy "ve o proprio pet e dos amigos" on public.pet_snapshots for select to authenticated
  using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
create policy "publica o proprio pet" on public.pet_snapshots for insert to authenticated with check (user_id = auth.uid());
create policy "atualiza o proprio pet" on public.pet_snapshots for update to authenticated using (user_id = auth.uid());

create policy "ve incentivos enviados e recebidos" on public.cheers for select to authenticated
  using (auth.uid() in (from_user, to_user));
create policy "incentiva amigos" on public.cheers for insert to authenticated
  with check (from_user = auth.uid() and public.are_friends(auth.uid(), to_user));

-- Pedido de amizade pelo código ---------------------------------------------
create or replace function public.send_friend_request(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  select id into target from profiles where friend_code = upper(trim(code));
  if target is null then raise exception 'Código não encontrado'; end if;
  if target = auth.uid() then raise exception 'Esse é o seu próprio código'; end if;
  -- Se a outra pessoa já tinha me convidado, aceita direto.
  update friendships set status = 'accepted'
    where requester = target and addressee = auth.uid();
  if not found then
    insert into friendships (requester, addressee) values (auth.uid(), target)
      on conflict do nothing;
  end if;
  return target;
end;
$$;

-- Visão usada na tela de Amigos/Ranking: eu + amigos aceitos, com o pet de cada um.
create or replace view public.friend_board with (security_invoker = true) as
  select p.id as user_id, p.username, p.display_name,
         s.pet_name, s.species, s.stage, s.mood, s.aura, s.variant,
         s.xp, s.streak, s.week_start,
         -- XP semanal só vale se a foto for desta semana.
         case when s.week_start = date_trunc('week', now())::date then s.weekly_xp else 0 end as weekly_xp,
         s.pets_lost, s.updated_at
  from profiles p
  left join pet_snapshots s on s.user_id = p.id
  where p.id = auth.uid() or public.are_friends(auth.uid(), p.id);
