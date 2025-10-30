# UFG Multiplataforma

Aplicación React + TypeScript con Electron para escritorio y Vite para web. Persistencia en Postgres (Supabase) usando un modelo normalizado y acceso vía DAOs. La autenticación es propia (sin Supabase Auth) usando bcrypt en la BD y un RPC `authenticate_user`.

Características principales
- Roles: administrador, profesor y estudiante, con interfaces y permisos diferenciados.
- CRUDs: estudiantes, profesores y cursos.
- Estudiantes: inscribirse/retirarse, ver su nota, vista "Mis cursos".
- Profesores: calificar estudiantes en sus cursos (no crean cursos).
- Admin: gestión completa y reportes.
- Exportes: PDF/Excel para cursos del alumno y resumen de cursos para admin.
- Empaquetado de escritorio con instalador NSIS.

## Estructura del proyecto

```
db/
  init.sql                # Esquema, RPCs y datos seed
electron/
  main.cjs                # Proceso principal de Electron
  preload.cjs             # Bridge seguro para renderer
src/
  models/                 # Esquemas Zod y tipos de dominio
  dao/                    # Acceso a datos (Supabase)
  controllers/            # Reglas de orquestación/UI actions
  views/                  # Páginas y pantallas (React Router)
  components/             # Componentes reutilizables (Modal, etc.)
  context/                # Contexto de autenticación
  lib/
    exporters.ts          # Exportadores PDF/Excel
    supabaseClient.ts     # Cliente Supabase instanciado
  App.tsx, main.tsx       # Shell de la app
vite.config.ts            # Config Vite (base './' para Electron)
package.json              # Scripts de dev/build/test
```

### Lógica y arquitectura
- MVC + DAO en el cliente:
  - Modelos (`src/models`): validación con Zod (ej. `CourseCreateSchema`).
  - DAOs (`src/dao`): realizan `select/insert/update/delete` usando Supabase JS.
  - Controladores (`src/controllers`): coordinan DAOs y UI, aplican reglas de rol.
- Autenticación: RPC `authenticate_user(email, password)` valida contra `users_app` (hash bcrypt con `pgcrypto`).
- Roles y permisos en UI:
  - Admin: CRUD completo, exportes globales.
  - Profesor: sólo califica en sus cursos.
  - Estudiante: inscribirse/retirarse, ver nota, "Mis cursos".
- Reportes/exportes: `src/lib/exporters.ts` genera PDFs/Excels; para admin se apoya en RPC `get_courses_with_counts`.

## Usuarios demo (login)
Los siguientes usuarios están sembrados en `db/init.sql` y permiten iniciar sesión:

- Admin:  
  - email: `admin@demo.com`  
  - password: `Admin1234`
- Profesor (1):  
  - email: `profesor@demo.com`  
  - password: `Profe1234`
- Estudiante (1):  
  - email: `estudiante@demo.com`  
  - password: `Alumno1234`

Usuarios adicionales de prueba:
- Profesores: `ana.prof@demo.com` / `ProfeD3mo`, `juan.prof@demo.com` / `ProfeD3mo`
- Estudiantes: `carlos.ruiz@demo.com`, `maria.gomez@demo.com`, `luis.torres@demo.com`, `sofia.diaz@demo.com` (todos con password `AlumnoD3mo`)

## Configuración y ejecución

1) Variables de entorno (.env)

```
VITE_SUPABASE_URL=...        # URL de tu instancia Supabase
VITE_SUPABASE_ANON_KEY=...   # Anon key
```

2) Levantar en modo web (Vite)

```bat
cmd /c npm install
cmd /c npm run dev
```

3) Modo escritorio (Electron + Vite)

```bat
cmd /c npm run dev:desktop
```

4) Build instalador de Windows (NSIS)

```bat
cmd /c npm run build:desktop
```
El instalador se genera en `dist-electron/` con nombre `UFG Multiplataforma Setup <version>.exe`.

## Pruebas unitarias (Vitest con UI)

- Ejecutar en consola: `cmd /c npm run test`
- UI interactiva: `cmd /c npm run test:ui`

Se incluyen pruebas de DAOs (`CourseDAO` y `StudentDAO`) con un mock de Supabase en memoria que valida:
- Entradas válidas e inválidas (Zod schemas).
- Manejo de errores.
- Integridad de operaciones CRUD.

## Notas de seguridad
- Para desarrollo, las políticas RLS en la BD están abiertas para tablas de dominio. Endurecer antes de producción.
- Las contraseñas demo están en el script de seed sólo para fines educativos.

## Licencia
Proyecto educativo para fines académicos.
