-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Roles de aplicación
create table if not exists roles (
  name text primary key
);

insert into roles (name) values ('admin'), ('profesor'), ('estudiante')
  on conflict (name) do nothing;

-- Autenticación simple en cliente (sin Supabase Auth): usuarios de la app
create table if not exists users_app (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null, -- bcrypt via pgcrypto: extensions.crypt('pwd', extensions.gen_salt('bf'))
  full_name text,
  role text not null references roles(name),
  created_at timestamp with time zone default now()
);

-- Migración: si existía columna en texto plano, convertir a bcrypt y eliminarla
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'users_app' and column_name = 'password'
  ) then
    alter table users_app rename column password to password_plaintext;
    alter table users_app add column if not exists password_hash text;
  update users_app set password_hash = extensions.crypt(password_plaintext, extensions.gen_salt('bf')) where password_hash is null;
    alter table users_app drop column password_plaintext;
  end if;
end$$;

-- Usuarios demo (hash bcrypt)
insert into users_app (email, password_hash, full_name, role)
values
  ('admin@demo.com', extensions.crypt('Admin1234', extensions.gen_salt('bf')), 'Admin Demo', 'admin'),
  ('profesor@demo.com', extensions.crypt('Profe1234', extensions.gen_salt('bf')), 'Profesor Demo', 'profesor'),
  ('estudiante@demo.com', extensions.crypt('Alumno1234', extensions.gen_salt('bf')), 'Estudiante Demo', 'estudiante')
on conflict (email) do nothing;

-- (Opcional) Bloques de perfiles ligados a auth.users eliminados para simplificar demo sin Supabase Auth

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users_app(id) on delete cascade,
  office text,
  phone text,
  created_at timestamp with time zone default now()
);

create table if not exists professors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users_app(id) on delete cascade,
  department text,
  academic_title text,
  created_at timestamp with time zone default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users_app(id) on delete cascade,
  student_code text unique,
  major text,
  semester int check (semester is null or semester >= 1),
  created_at timestamp with time zone default now()
);

-- Migración: eliminar columnas duplicadas y asegurar estructura normalizada
do $$
begin
  -- admins: quitar name/email si existen
  if exists (select 1 from information_schema.columns where table_name='admins' and column_name='name') then
    alter table admins drop column name;
  end if;
  if exists (select 1 from information_schema.columns where table_name='admins' and column_name='email') then
    alter table admins drop column email;
  end if;
  -- professors: quitar name/email si existen
  if exists (select 1 from information_schema.columns where table_name='professors' and column_name='name') then
    alter table professors drop column name;
  end if;
  if exists (select 1 from information_schema.columns where table_name='professors' and column_name='email') then
    alter table professors drop column email;
  end if;
  -- students: quitar name/email si existen
  if exists (select 1 from information_schema.columns where table_name='students' and column_name='name') then
    alter table students drop column name;
  end if;
  if exists (select 1 from information_schema.columns where table_name='students' and column_name='email') then
    alter table students drop column email;
  end if;

  -- Asegurar user_id NOT NULL cuando no hay nulos
  if exists (select 1 from information_schema.columns where table_name='admins' and column_name='user_id') then
    if not exists (select 1 from admins where user_id is null) then
      alter table admins alter column user_id set not null;
    end if;
  end if;
  if exists (select 1 from information_schema.columns where table_name='professors' and column_name='user_id') then
    if not exists (select 1 from professors where user_id is null) then
      alter table professors alter column user_id set not null;
    end if;
  end if;
  if exists (select 1 from information_schema.columns where table_name='students' and column_name='user_id') then
    if not exists (select 1 from students where user_id is null) then
      alter table students alter column user_id set not null;
    end if;
  end if;
end$$;

-- Cursos (relación simple: un profesor responsable opcional)
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits int not null check (credits >= 0),
  professor_id uuid references professors(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Matrículas (estudiante-curso)
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (student_id, course_id)
);

-- Calificaciones (por matrícula)
create table if not exists grades (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  value numeric(5,2) not null check (value >= 0),
  note text,
  created_at timestamp with time zone default now()
);
-- Habilitar RLS y políticas básicas (permisivas) para desarrollo
alter table users_app enable row level security; -- protegida: sin políticas abiertas
alter table professors enable row level security;
alter table students enable row level security;
alter table courses enable row level security;
alter table enrollments enable row level security;
alter table grades enable row level security;
alter table admins enable row level security;

-- En desarrollo: permitir CRUD; refinar por rol más adelante
create policy if not exists "professors_anon_all"
  on professors for all to anon using (true) with check (true);
create policy if not exists "students_anon_all"
  on students for all to anon using (true) with check (true);
create policy if not exists "courses_anon_all"
  on courses for all to anon using (true) with check (true);
create policy if not exists "enrollments_anon_all"
  on enrollments for all to anon using (true) with check (true);
create policy if not exists "grades_anon_all"
  on grades for all to anon using (true) with check (true);
create policy if not exists "admins_anon_all"
  on admins for all to anon using (true) with check (true);

insert into admins (user_id, office, phone)
select ua.id, 'A-101', '+503 5555-0001'
from users_app ua
where ua.role = 'admin'
on conflict (user_id) do nothing;

insert into professors (user_id, department, academic_title)
select ua.id, 'Ingeniería', 'Ing.'
from users_app ua
where ua.role = 'profesor'
on conflict (user_id) do nothing;

insert into students (user_id, student_code, major, semester)
select ua.id, 'A001', 'Ingeniería en Sistemas', 1
from users_app ua
where ua.role = 'estudiante'
on conflict (user_id) do nothing;

-- RPC para autenticación sin exponer hashes
create or replace function authenticate_user(p_email text, p_password text)
returns table (id uuid, email text, full_name text, role text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select u.id, u.email, u.full_name, u.role
  from users_app u
  where u.email = p_email
    and u.password_hash = extensions.crypt(p_password, u.password_hash)
  limit 1;
end;
$$;

grant execute on function authenticate_user(text, text) to anon;

-- Crear usuario con hash y rol (idempotente por email)
create or replace function create_user_with_role(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  insert into users_app (email, password_hash, full_name, role)
  values (p_email, extensions.crypt(p_password, extensions.gen_salt('bf')), p_full_name, p_role)
  on conflict (email) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function create_user_with_role(text, text, text, text) to anon;

-- Crear profesor y su usuario (atómico)
create or replace function create_professor_with_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_department text,
  p_academic_title text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_user_id uuid; v_prof_id uuid;
begin
  v_user_id := create_user_with_role(p_email, p_password, p_full_name, 'profesor');
  insert into professors (user_id, department, academic_title)
  values (v_user_id, p_department, p_academic_title)
  on conflict (user_id) do update
    set department = excluded.department,
        academic_title = excluded.academic_title
  returning id into v_prof_id;
  return v_prof_id;
end;
$$;

grant execute on function create_professor_with_user(text, text, text, text, text) to anon;

-- Crear estudiante y su usuario (atómico)
create or replace function create_student_with_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_student_code text,
  p_major text,
  p_semester int
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_user_id uuid; v_student_id uuid;
begin
  v_user_id := create_user_with_role(p_email, p_password, p_full_name, 'estudiante');
  insert into students (user_id, student_code, major, semester)
  values (v_user_id, p_student_code, p_major, p_semester)
  on conflict (user_id) do update
    set student_code = excluded.student_code,
        major = excluded.major,
        semester = excluded.semester
  returning id into v_student_id;
  return v_student_id;
end;
$$;

grant execute on function create_student_with_user(text, text, text, text, text, int) to anon;

-- Actualizar datos de usuario y estudiante (opcionales)
create or replace function update_user_and_student(
  p_user_id uuid,
  p_email text default null,
  p_full_name text default null,
  p_password text default null,
  p_student_code text default null,
  p_major text default null,
  p_semester int default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update users_app set
    email = coalesce(p_email, email),
    full_name = coalesce(p_full_name, full_name),
    password_hash = case when p_password is not null then extensions.crypt(p_password, extensions.gen_salt('bf')) else password_hash end
  where id = p_user_id;

  update students set
    student_code = coalesce(p_student_code, student_code),
    major = coalesce(p_major, major),
    semester = coalesce(p_semester, semester)
  where user_id = p_user_id;
end;
$$;

grant execute on function update_user_and_student(uuid, text, text, text, text, text, int) to anon;

-- Actualizar datos de usuario y profesor (opcionales)
create or replace function update_user_and_professor(
  p_user_id uuid,
  p_email text default null,
  p_full_name text default null,
  p_password text default null,
  p_department text default null,
  p_academic_title text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update users_app set
    email = coalesce(p_email, email),
    full_name = coalesce(p_full_name, full_name),
    password_hash = case when p_password is not null then extensions.crypt(p_password, extensions.gen_salt('bf')) else password_hash end
  where id = p_user_id;

  update professors set
    department = coalesce(p_department, department),
    academic_title = coalesce(p_academic_title, academic_title)
  where user_id = p_user_id;
end;
$$;

grant execute on function update_user_and_professor(uuid, text, text, text, text, text) to anon;

-- ==========================================================
-- Datos de prueba adicionales (para desarrollo/demo)
-- Idempotentes: usan ON CONFLICT/NOT EXISTS para evitar duplicados
-- ==========================================================

-- Reporte: cursos con profesor y cantidad de estudiantes
create or replace function get_courses_with_counts()
returns table (
  course_id uuid,
  name text,
  credits int,
  professor_name text,
  professor_email text,
  students_count int
)
language sql
security definer
set search_path = public
as $$
  select c.id as course_id,
         c.name,
         c.credits,
         u.full_name as professor_name,
         u.email as professor_email,
         coalesce(count(e.id), 0) as students_count
  from courses c
  left join professors p on p.id = c.professor_id
  left join users_app u on u.id = p.user_id
  left join enrollments e on e.course_id = c.id
  group by c.id, c.name, c.credits, u.full_name, u.email
  order by c.created_at desc;
$$;

grant execute on function get_courses_with_counts() to anon;

-- Cuentas de acceso para profesores de prueba
insert into users_app (email, password_hash, full_name, role)
values
  ('ana.prof@demo.com', extensions.crypt('ProfeD3mo', extensions.gen_salt('bf')), 'Ana López', 'profesor'),
  ('juan.prof@demo.com', extensions.crypt('ProfeD3mo', extensions.gen_salt('bf')), 'Juan Pérez', 'profesor')
on conflict (email) do nothing;

-- Profesores enlazados a sus cuentas
insert into professors (user_id, department, academic_title)
select ua.id, 'Ingeniería', 'MSc.' from users_app ua where ua.email='ana.prof@demo.com'
on conflict do nothing;
insert into professors (user_id, department, academic_title)
select ua.id, 'Ciencias', 'PhD' from users_app ua where ua.email='juan.prof@demo.com'
on conflict do nothing;

-- Cuentas de acceso para estudiantes de prueba
insert into users_app (email, password_hash, full_name, role)
values
  ('carlos.ruiz@demo.com', extensions.crypt('AlumnoD3mo', extensions.gen_salt('bf')), 'Carlos Ruiz', 'estudiante'),
  ('maria.gomez@demo.com', extensions.crypt('AlumnoD3mo', extensions.gen_salt('bf')), 'María Gómez', 'estudiante'),
  ('luis.torres@demo.com', extensions.crypt('AlumnoD3mo', extensions.gen_salt('bf')), 'Luis Torres', 'estudiante'),
  ('sofia.diaz@demo.com', extensions.crypt('AlumnoD3mo', extensions.gen_salt('bf')), 'Sofía Díaz', 'estudiante')
on conflict (email) do nothing;

-- Estudiantes enlazados a sus cuentas
insert into students (user_id, student_code, major, semester)
select ua.id, 'A002', 'Ingeniería en Sistemas', 2 from users_app ua where ua.email='carlos.ruiz@demo.com'
on conflict do nothing;
insert into students (user_id, student_code, major, semester)
select ua.id, 'A003', 'Ingeniería en Sistemas', 3 from users_app ua where ua.email='maria.gomez@demo.com'
on conflict do nothing;
insert into students (user_id, student_code, major, semester)
select ua.id, 'A004', 'Ingeniería en Sistemas', 1 from users_app ua where ua.email='luis.torres@demo.com'
on conflict do nothing;
insert into students (user_id, student_code, major, semester)
select ua.id, 'A005', 'Ingeniería en Sistemas', 4 from users_app ua where ua.email='sofia.diaz@demo.com'
on conflict do nothing;

-- Cursos (asignados a profesores por email); usa NOT EXISTS para no duplicar por nombre
insert into courses (name, credits, professor_id)
select 'Programación I', 4, p.id
from professors p
join users_app u on u.id = p.user_id
where u.email = 'ana.prof@demo.com'
  and not exists (select 1 from courses where name = 'Programación I');

insert into courses (name, credits, professor_id)
select 'Bases de Datos', 3, p.id
from professors p
join users_app u on u.id = p.user_id
where u.email = 'juan.prof@demo.com'
  and not exists (select 1 from courses where name = 'Bases de Datos');

-- Matrículas (student x course) con ON CONFLICT en (student_id, course_id)
insert into enrollments (student_id, course_id)
select s.id, c.id
from students s
join users_app u on u.id = s.user_id
join courses c on c.name = 'Programación I'
where u.email = 'carlos.ruiz@demo.com'
on conflict (student_id, course_id) do nothing;

insert into enrollments (student_id, course_id)
select s.id, c.id
from students s
join users_app u on u.id = s.user_id
join courses c on c.name = 'Programación I'
where u.email = 'maria.gomez@demo.com'
on conflict (student_id, course_id) do nothing;

insert into enrollments (student_id, course_id)
select s.id, c.id
from students s
join users_app u on u.id = s.user_id
join courses c on c.name = 'Bases de Datos'
where u.email = 'luis.torres@demo.com'
on conflict (student_id, course_id) do nothing;

insert into enrollments (student_id, course_id)
select s.id, c.id
from students s
join users_app u on u.id = s.user_id
join courses c on c.name = 'Bases de Datos'
where u.email = 'sofia.diaz@demo.com'
on conflict (student_id, course_id) do nothing;

-- Calificaciones por matrícula (evita duplicar con NOT EXISTS)
insert into grades (enrollment_id, value, note)
select e.id, 8.5, 'Parcial 1'
from enrollments e
join students s on s.id = e.student_id
join courses c on c.id = e.course_id
join users_app u on u.id = s.user_id
where u.email = 'carlos.ruiz@demo.com' and c.name = 'Programación I'
  and not exists (select 1 from grades g where g.enrollment_id = e.id);

insert into grades (enrollment_id, value, note)
select e.id, 7.8, 'Parcial 1'
from enrollments e
join students s on s.id = e.student_id
join courses c on c.id = e.course_id
join users_app u on u.id = s.user_id
where u.email = 'maria.gomez@demo.com' and c.name = 'Programación I'
  and not exists (select 1 from grades g where g.enrollment_id = e.id);

insert into grades (enrollment_id, value, note)
select e.id, 9.2, 'Parcial 1'
from enrollments e
join students s on s.id = e.student_id
join courses c on c.id = e.course_id
join users_app u on u.id = s.user_id
where u.email = 'luis.torres@demo.com' and c.name = 'Bases de Datos'
  and not exists (select 1 from grades g where g.enrollment_id = e.id);

insert into grades (enrollment_id, value, note)
select e.id, 6.9, 'Parcial 1'
from enrollments e
join students s on s.id = e.student_id
join courses c on c.id = e.course_id
join users_app u on u.id = s.user_id
where u.email = 'sofia.diaz@demo.com' and c.name = 'Bases de Datos'
  and not exists (select 1 from grades g where g.enrollment_id = e.id);

-- (Opcional) Crear cuentas de acceso para algunos de los nuevos perfiles:
-- insert into users_app (email, password_hash, full_name, role)
-- values ('ana.prof@demo.com', crypt('ProfeD3mo', gen_salt('bf')), 'Ana López', 'profesor')
-- on conflict (email) do nothing;
-- insert into users_app (email, password_hash, full_name, role)
-- values ('carlos.ruiz@demo.com', crypt('AlumnoD3mo', gen_salt('bf')), 'Carlos Ruiz', 'estudiante')
-- on conflict (email) do nothing;
-- Y luego enlazar:
-- update professors p set user_id = u.id from users_app u where p.email = u.email and p.email = 'ana.prof@demo.com' and p.user_id is null;
-- update students s set user_id = u.id from users_app u where s.email = u.email and s.email = 'carlos.ruiz@demo.com' and s.user_id is null;
