# Pawly Dog Rescue — Website + Laravel CMS

A production-ready dog-rescue website with a public blog and a secure content
studio. The React + Vite frontend talks to a Laravel 12 API that uses Sanctum's
cookie-based SPA authentication, MySQL, and local image uploads.

- **Frontend:** React 19, Vite 8, React Router 7, react-markdown
- **Backend:** Laravel 12, Laravel Sanctum 4, PHP 8.2+ (tested on PHP 8.5)
- **Database:** MySQL / MariaDB (XAMPP + phpMyAdmin friendly)
- **Auth:** HttpOnly Sanctum session cookie + `XSRF-TOKEN` cookie
- **Uploads:** `backend/storage/app/public/blogs`, exposed through `storage:link`

---

## Table of contents

1. [Features](#features)
2. [Folder structure](#folder-structure)
3. [Prerequisites](#prerequisites)
4. [Quick start](#quick-start)
5. [Environment variables](#environment-variables)
6. [Database setup with phpMyAdmin](#database-setup-with-phpmyadmin)
7. [Migrations, seeders, and storage](#migrations-seeders-and-storage)
8. [Running the apps](#running-the-apps)
9. [Authentication flow](#authentication-flow)
10. [API reference](#api-reference)
11. [Admin CMS usage](#admin-cms-usage)
12. [Vite proxy and CORS](#vite-proxy-and-cors)
13. [Default credentials](#default-credentials)
14. [Production checklist](#production-checklist)
15. [Troubleshooting](#troubleshooting)
16. [Available scripts](#available-scripts)

---

## Features

### Public site

- Marketing homepage, About page, donation flow (existing Stripe demo server).
- `/blogs` — paginated, searchable list of published posts.
- `/blogs/:slug` — single post rendered from Markdown with GitHub-flavoured
  tables, task lists, and syntax-friendly formatting.
- Responsive "Blogs" navigation tab and footer link to the CMS.
- Friendly 404 page for missing or unpublished stories.
- SEO-friendly page titles and semantic article markup.

### Admin CMS

- `/admin/login` — validated login form with loading and error states.
- `/admin/*` — protected by a session check and an `is_admin` guard.
- `/admin/blogs` — table of all posts (drafts + published), status tabs,
  search by title/slug, pagination, edit/view/delete actions.
- `/admin/blogs/new` and `/admin/blogs/:id/edit` — title, auto-generated slug,
  excerpt, Markdown editor with formatting toolbar and live preview, status
  toggle, publish date, featured-image upload with preview/removal.
- Delete confirmation modal with inline API errors.
- One-time success flash messages after create/update/delete.
- Secure logout that invalidates the server session and local auth state.

### Backend

- `users.is_admin` flag, default `false`, with a seeded administrator.
- `posts` table with unique slugs, draft/published status, nullable publish
  date, optional featured image, and author relationship.
- Public API only returns posts that are published **and** whose publish date
  has passed.
- Admin API supports full CRUD, validation, unique-slug generation, image
  replacement/removal, and automatic image cleanup on delete.
- Consistent JSON through `PostResource`.

---

## Folder structure

```
nonprofit-main_withPGnJson/
├─ backend/                              Laravel 12 API
│  ├─ app/
│  │  ├─ Http/
│  │  │  ├─ Controllers/Api/
│  │  │  │  ├─ AuthController.php        login / logout / current user
│  │  │  │  ├─ PublicBlogController.php  published list + show by slug
│  │  │  │  └─ AdminBlogController.php   full CRUD for all posts
│  │  │  ├─ Middleware/
│  │  │  │  └─ EnsureUserIsAdmin.php     blocks non-admin writes
│  │  │  ├─ Requests/
│  │  │  │  ├─ LoginRequest.php
│  │  │  │  ├─ StorePostRequest.php
│  │  │  │  ├─ UpdatePostRequest.php
│  │  │  │  └─ Concerns/
│  │  │  │     ├─ GeneratesUniqueSlug.php
│  │  │  │     └─ HandlesFeaturedImage.php
│  │  │  └─ Resources/
│  │  │     └─ PostResource.php          stable API payload
│  │  └─ Models/
│  │     ├─ User.php                     hasMany posts, isAdmin()
│  │     └─ Post.php                     belongsTo author, published scope
│  ├─ bootstrap/app.php                  Sanctum stateful API + admin alias
│  ├─ config/
│  │  ├─ cors.php                        credentials + allowed origins
│  │  ├─ database.php                    MySQL connection
│  │  └─ sanctum.php                     stateful domains
│  ├─ database/
│  │  ├─ factories/{UserFactory,PostFactory}.php
│  │  ├─ migrations/
│  │  │  ├─ 0001_01_01_000000_create_users_table.php
│  │  │  ├─ 2026_11_13_081605_add_is_admin_to_users_table.php
│  │  │  └─ 2026_11_13_081606_create_posts_table.php
│  │  └─ seeders/DatabaseSeeder.php      admin + local demo posts
│  ├─ public/
│  │  └─ storage -> ../storage/app/public
│  ├─ routes/
│  │  ├─ api.php                         all API routes
│  │  └─ web.php
│  ├─ storage/app/public/blogs/          uploaded featured images
│  ├─ .env                               local configuration (not committed)
│  ├─ .env.example                       documented template
│  ├─ artisan
│  └─ composer.json
├─ public/                               static frontend assets
├─ server/                               existing Express/Stripe demo API
├─ src/
│  ├─ api/
│  │  ├─ client.js                       fetch wrapper, CSRF, ApiError
│  │  ├─ auth.js                         login/logout/current user
│  │  └─ posts.js                        public + admin blog calls
│  ├─ components/
│  │  ├─ ProtectedRoute.jsx              redirects unauthenticated users
│  │  ├─ admin/{ConfirmDialog,StatusBadge}.jsx
│  │  └─ blog/{BlogCard,MarkdownContent}.jsx
│  ├─ context/
│  │  ├─ AuthContext.jsx                 AuthProvider (session restore)
│  │  └─ auth-context.js                 context object + useAuth hook
│  ├─ layouts/
│  │  ├─ PublicLayout.jsx                header + footer + outlet
│  │  └─ AdminLayout.jsx                 sidebar + user card + outlet
│  ├─ pages/
│  │  ├─ BlogListPage.jsx
│  │  ├─ BlogDetailPage.jsx
│  │  ├─ NotFoundPage.jsx
│  │  └─ admin/
│  │     ├─ AdminLoginPage.jsx
│  │     ├─ AdminBlogListPage.jsx
│  │     └─ AdminBlogEditorPage.jsx
│  ├─ styles/{blog.css,admin.css}        blog + CMS styling
│  ├─ utils/format.js                    dates, errors, slugs
│  ├─ App.jsx                            route definitions
│  └─ main.jsx
├─ .env                                  Vite / Stripe environment
├─ eslint.config.js                      ignores backend/dist, JSX-aware
├─ index.html
├─ package.json
├─ vite.config.js                        dev proxy to Laravel + Stripe
└─ README.md
```

---

## Prerequisites

- **Node.js 20+** and npm
- **PHP 8.2+** with `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, and `gd`
  or `imagick` (recommended for image handling)
- **Composer 2**
- **MySQL 8** or **MariaDB 10.4+** (XAMPP works)
- **phpMyAdmin** (optional but recommended for inspecting data)

Verify the tools:

```powershell
node --version
npm --version
php --version
composer --version
```

---

## Quick start

From the project root:

```powershell
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd backend
composer install

# 3. Create the environment file and app key
copy .env.example .env
php artisan key:generate

# 4. Create the MySQL database (see the phpMyAdmin section), then:
php artisan migrate --seed

# 5. Expose uploaded images
php artisan storage:link

# 6. Back to the project root
cd ..

# 7. Start Laravel, the Stripe demo server, and Vite together
npm run dev:all
```

Open:

- Public site: <http://localhost:5173>
- Blog: <http://localhost:5173/blogs>
- Admin login: <http://localhost:5173/admin/login>
- Laravel API health: <http://localhost:8000/up>

If you do not need the donation/Stripe demo server, run the two required
processes separately:

```powershell
npm run api     # Laravel on :8000
npm run dev     # Vite on :5173
```

---

## Environment variables

### Frontend — `.env` in the project root

```dotenv
# Existing Stripe demo configuration
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Laravel CMS API. Relative URLs work with the Vite dev proxy.
VITE_API_BASE_URL=/api
VITE_SANCTUM_CSRF_URL=/sanctum/csrf-cookie
```

When the frontend and API are on different hosts in production, point
`VITE_API_BASE_URL` at the API origin (for example
`https://api.pawlyrescue.org/api`) and keep `VITE_SANCTUM_CSRF_URL` on the same
origin (`https://api.pawlyrescue.org/sanctum/csrf-cookie`).

### Backend — `backend/.env`

```dotenv
APP_NAME="Pawly CMS"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pawly_cms
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
SESSION_DOMAIN=localhost
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=false

SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost,localhost:8000,127.0.0.1,127.0.0.1:8000
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173

FILESYSTEM_DISK=local

ADMIN_NAME="Pawly Administrator"
ADMIN_EMAIL=admin@pawlyrescue.org
ADMIN_PASSWORD=password
```

Notes:

- `SESSION_DOMAIN=localhost` is required so the session cookie is shared
  between the Vite origin and the Laravel API during local development.
- `SANCTUM_STATEFUL_DOMAINS` must list every frontend origin that sends
  authenticated requests, including the port.
- `CORS_ALLOWED_ORIGINS` is read by `config/cors.php`; `supports_credentials`
  is always `true` for Sanctum.
- `ADMIN_*` values are only used by the seeder. Change the password before any
  shared or production deployment.

---

## Database setup with phpMyAdmin

1. Start **Apache** and **MySQL** from the XAMPP control panel.
2. Open <http://localhost/phpmyadmin>.
3. Click **New**, enter the database name `pawly_cms`, choose
   `utf8mb4_unicode_ci`, and click **Create**.
4. Make sure `backend/.env` uses the same database name, host, port, user, and
   password.
5. Run the migrations from `backend/`:

   ```powershell
   php artisan migrate --seed
   ```

   On a fresh local database you can rebuild everything:

   ```powershell
   php artisan migrate:fresh --seed
   ```

   `migrate:fresh` **drops every table** in `pawly_cms`; only use it locally.

6. In phpMyAdmin, select `pawly_cms` and confirm these tables exist:

   | Table | Purpose |
   | --- | --- |
   | `users` | Administrators; includes `is_admin` |
   | `posts` | Blog posts, drafts, slugs, images |
   | `sessions` | Sanctum/SPA sessions |
   | `personal_access_tokens` | Sanctum token support |
   | `cache`, `cache_locks` | Framework cache |
   | `jobs`, `job_batches`, `failed_jobs` | Queued work |

7. Open the `users` table and confirm the seeded administrator:

   | Column | Value |
   | --- | --- |
   | `name` | `Pawly Administrator` |
   | `email` | `admin@pawlyrescue.org` |
   | `is_admin` | `1` |

8. Open the `posts` table. A fresh local seed contains three published posts
   and one draft. The `featured_image` column stores either a path such as
   `blogs/abc123.png` or a full external URL.

### Connecting with a different MySQL user

If `root` has a password in your XAMPP installation, update
`DB_USERNAME`/`DB_PASSWORD` in `backend/.env` and clear the config cache:

```powershell
php artisan config:clear
```

---

## Migrations, seeders, and storage

```powershell
cd backend

# Run pending migrations only
php artisan migrate

# Run migrations and seed the admin + local demo content
php artisan migrate --seed

# Rebuild the local database from scratch (destructive)
php artisan migrate:fresh --seed

# Seed without migrating
php artisan db:seed

# Create the public storage symlink (required for uploaded images)
php artisan storage:link
```

Uploaded files are written to:

```
backend/storage/app/public/blogs/
```

and served from:

```
http://localhost:8000/storage/blogs/<filename>
```

The API returns an absolute `featured_image_url` built from `APP_URL`, so keep
`APP_URL` accurate in every environment. External image URLs (for example the
Unsplash images in the demo seed) are returned unchanged.

Demo content is only seeded when `APP_ENV` is `local` or `testing` **and** the
`posts` table is empty. Production seeding creates only the administrator.

---

## Running the apps

| Command | What it starts |
| --- | --- |
| `npm run dev` | Vite frontend on <http://localhost:5173> |
| `npm run api` | Laravel API on <http://localhost:8000> |
| `npm run server` | Existing Express/Stripe demo API on <http://localhost:4242> |
| `npm run dev:all` | All three processes with `concurrently` |
| `npm run build` | Production frontend build in `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint over the frontend (ignores `backend/` and `dist/`) |

`npm run dev:all` is the easiest local workflow. If port `8000` or `5173` is
already in use, stop the conflicting process first or pass a different port:

```powershell
npm run dev -- --port 5174
php backend/artisan serve --host=localhost --port=8001
```

If you change the Laravel port, update the proxy targets in `vite.config.js`
or set `VITE_LARAVEL_PROXY_TARGET` before starting Vite.

---

## Authentication flow

This project uses Sanctum's **SPA cookie mode**, not bearer tokens.

1. The frontend calls `GET /sanctum/csrf-cookie` to receive an `XSRF-TOKEN`
   cookie.
2. `POST /api/login` sends the credentials with `credentials: 'include'` and
   the decoded token in `X-XSRF-TOKEN`.
3. Laravel authenticates the user, regenerates the session ID, verifies
   `is_admin`, and returns the user payload.
4. The browser stores an HttpOnly session cookie. The React app keeps only the
   user object in memory and restores it on refresh with `GET /api/user`.
5. Every admin write sends the CSRF token again. A `419` response triggers one
   automatic CSRF refresh and retry in `src/api/client.js`.
6. `POST /api/logout` invalidates the server session and CSRF token; the
   frontend clears local state even if the network request fails.
7. `ProtectedRoute` shows a session-check spinner, redirects unauthenticated
   users to `/admin/login`, and preserves the attempted path in router state.

The `EnsureUserIsAdmin` middleware protects every admin route. Authentication
alone is not enough: `users.is_admin` must be `true`.

---

## API reference

Base URL during development: `http://localhost:8000/api` (proxied through
Vite as `/api`).

### Public

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/blogs` | Paginated published posts. Query: `page`, `per_page` (max 100), `q` |
| `GET` | `/api/blogs/{slug}` | One published post by slug; `404` when missing or unpublished |

### Auth

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/sanctum/csrf-cookie` | — | Sets the `XSRF-TOKEN` cookie |
| `POST` | `/api/login` | — | Body: `email`, `password`, optional `remember` |
| `POST` | `/api/logout` | session | Invalidates the session |
| `GET` | `/api/user` | session | Current administrator |

### Admin (requires session + `is_admin`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/blogs` | All posts. Query: `page`, `per_page`, `status`, `q` |
| `POST` | `/api/admin/blogs` | Create a post (`multipart/form-data` for images) |
| `GET` | `/api/admin/blogs/{id}` | Post for the editor |
| `PUT/PATCH` | `/api/admin/blogs/{id}` | Update a post |
| `DELETE` | `/api/admin/blogs/{id}` | Delete a post and its local image |

The frontend updates posts with `POST` + `_method=PUT` because multipart file
uploads are not reliably supported by `PUT` in every browser/proxy setup.

### Post payload

```json
{
  "data": {
    "id": 1,
    "title": "How We Help Rescue Dogs Heal",
    "slug": "how-we-help-rescue-dogs-heal",
    "excerpt": "From the first medical check to a calm foster home…",
    "content": "## A second chance starts with safety…",
    "featured_image": "blogs/example.png",
    "featured_image_url": "http://localhost:8000/storage/blogs/example.png",
    "status": "published",
    "published_at": "2026-11-07T08:00:00+00:00",
    "created_at": "2026-11-01T08:00:00+00:00",
    "updated_at": "2026-11-07T08:00:00+00:00",
    "author": { "id": 1, "name": "Pawly Administrator" }
  }
}
```

List endpoints wrap results in `data` and add Laravel pagination `meta` and
`links` objects.

### Validation rules

`StorePostRequest` / `UpdatePostRequest` enforce:

- `title` — required, string, max 255
- `slug` — optional, lowercase letters/numbers/hyphens, unique (ignores the
  current post on update); generated from the title when omitted
- `excerpt` — nullable, string, max 500
- `content` — required, string
- `status` — `draft` or `published`
- `published_at` — nullable date; ignored for drafts
- `featured_image` — image, max 5 MB, common web formats
- `remove_featured_image` — optional boolean

---

## Admin CMS usage

1. Go to <http://localhost:5173/admin/login>.
2. Sign in with the seeded administrator.
3. **All posts** shows drafts and published posts. Use the status tabs or the
   search field to narrow the table.
4. **New post**:
   - Type a title; the slug is generated automatically.
   - Edit the slug manually if needed, or click **Regenerate**.
   - Write Markdown and use the toolbar for bold, italic, headings, links,
     lists, quotes, and inline code.
   - Switch to **Preview** to render the post.
   - Choose **Draft** or **Published**. Publishing without a date uses "now".
   - Upload a JPG, PNG, WebP, or GIF up to 5 MB. A preview appears before save.
5. **Edit** opens the same editor with existing values and image.
6. **Delete** opens a confirmation dialog and removes the post plus its local
   uploaded image.
7. **Sign out** invalidates the server session and returns to the login page.

Draft posts are never returned by the public API, even if someone knows the
slug.

---

## Vite proxy and CORS

`vite.config.js` routes CMS traffic to Laravel and keeps the existing Express
API working. More specific paths must stay above the generic `/api` entry:

```js
const laravelApi = process.env.VITE_LARAVEL_PROXY_TARGET || 'http://localhost:8000'
const stripeApi = process.env.VITE_STRIPE_PROXY_TARGET || 'http://localhost:4242'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sanctum': laravelApi,
      '/storage': laravelApi,
      '/api/login': laravelApi,
      '/api/logout': laravelApi,
      '/api/user': laravelApi,
      '/api/blogs': laravelApi,
      '/api/admin': laravelApi,
      '/api': stripeApi, // existing Express/Stripe endpoints
    },
  },
})
```

Why this matters:

- `/api/blogs` and `/api/admin` must reach Laravel.
- `/api/donations/total`, `/api/create-payment-intent`, and `/api/health`
  continue to reach the Express server.
- `/sanctum` and `/storage` must also reach Laravel so cookies and uploaded
  images work through the Vite origin.

`backend/config/cors.php` allows credentialed requests from
`CORS_ALLOWED_ORIGINS`. In production, add the exact HTTPS frontend origin and
never use `*` with credentials enabled.

---

## Default credentials

Local development only:

```
Email:    admin@pawlyrescue.org
Password: password
```

Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` **before** running the
seeder in any shared environment, then re-seed or update the user manually.

The login page shows the seed hint only when Vite runs in development mode
(`import.meta.env.DEV`).

---

## Production checklist

1. **Environment**
   - Set `APP_ENV=production`, `APP_DEBUG=false`, and a strong `APP_KEY`.
   - Set `APP_URL` to the public API URL (HTTPS).
   - Set `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, and
     `SANCTUM_STATEFUL_DOMAINS` to the production frontend host.
   - Set `SESSION_DOMAIN` to the shared parent domain when the SPA and API use
     subdomains (for example `.pawlyrescue.org`).
   - Set `SESSION_SECURE_COOKIE=true` and `SESSION_SAME_SITE=lax` (or `none`
     only when the SPA and API are on different sites, together with HTTPS).
   - Use a dedicated MySQL user with a strong password; do not ship `root`.
   - Set `ADMIN_*` to real values before seeding.
2. **Database**
   - Run `php artisan migrate --force`.
   - Seed only the administrator, or create it with a one-off command.
3. **Storage**
   - Run `php artisan storage:link` on the server.
   - Ensure `storage/` and `bootstrap/cache/` are writable by the web user.
   - If using S3 or another disk, update `FILESYSTEM_DISK` and the
     `featured_image_url` logic accordingly.
4. **Caching**
   - `php artisan config:cache`
   - `php artisan route:cache`
   - `php artisan view:cache`
   - Re-run these after changing environment variables.
5. **Frontend**
   - `npm ci`
   - `npm run build`
   - Serve `dist/` from Nginx/Apache or a static host.
   - Configure SPA fallback so `/blogs/:slug` and `/admin/*` return
     `index.html`.
6. **Security**
   - Use HTTPS end to end.
   - Rotate the seeded password.
   - Keep `is_admin` limited to trusted accounts.
   - Validate uploads (already enforced server-side) and consider antivirus or
     object storage for high-traffic deployments.
   - Back up the database and the `storage/app/public/blogs` directory.
7. **Operations**
   - Point the web server document root at `backend/public`.
   - Run a queue worker if you enable queued jobs.
   - Monitor `backend/storage/logs/laravel.log`.

---

## Troubleshooting

### `401 Unauthenticated` after login

- Confirm the request includes cookies (`credentials: 'include'`).
- Confirm `SANCTUM_STATEFUL_DOMAINS` includes the exact frontend origin and
  port.
- Confirm `SESSION_DOMAIN` matches the host used by both apps.
- Clear cookies and try again; an old session cookie can mask config changes.

### `419 CSRF token mismatch`

- The `XSRF-TOKEN` cookie is missing or stale. Reload the page and sign in
  again.
- The frontend sends `X-XSRF-TOKEN` automatically for non-GET requests. If you
  added a custom client, make sure it does the same.
- After changing `.env`, run `php artisan config:clear`.

### `Session store not set on request`

Sanctum did not treat the request as stateful. Check the `Origin`/`Referer`
headers and `SANCTUM_STATEFUL_DOMAINS`. Browser requests through the Vite proxy
include the right origin automatically.

### CORS errors

- Add the exact origin (scheme + host + port) to `CORS_ALLOWED_ORIGINS`.
- Keep `supports_credentials => true` in `backend/config/cors.php`.
- Do not use `*` for allowed origins when credentials are enabled.

### Images return `403` or do not load

- Run `php artisan storage:link` from `backend/`.
- Confirm the file exists in `backend/storage/app/public/blogs/`.
- Confirm `APP_URL` is correct; `featured_image_url` is built from it.
- Check that the `public/storage` symlink is present.

### Database connection refused

- Start MySQL/MariaDB in XAMPP.
- Verify `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`.
- Create the database before migrating.
- Run `php artisan config:clear` after editing `.env`.

### `php artisan` cannot find the app

Run commands from `backend/`, or use the root script which already points at
the backend:

```powershell
npm run api
```

### Vite proxy sends CMS requests to Stripe

The generic `/api` proxy must come **after** `/api/blogs`, `/api/admin`,
`/api/login`, `/api/logout`, and `/api/user`. Keep the order shown in
`vite.config.js`.

### Lint scans thousands of backend files

`eslint.config.js` ignores `backend/**`, `dist/**`, and `node_modules/**`.
If you add another generated directory, add it to `globalIgnores`.

---

## Available scripts

### Root `package.json`

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite |
| `npm run api` | Start Laravel on port 8000 |
| `npm run api:seed` | Run `php artisan migrate --seed` |
| `npm run server` | Start the Express/Stripe demo API |
| `npm run dev:all` | Run API, Stripe server, and Vite together |
| `npm run build` | Build the frontend |
| `npm run lint` | Lint the frontend |
| `npm run preview` | Preview the production build |

### Backend

| Command | Description |
| --- | --- |
| `php artisan migrate` | Run pending migrations |
| `php artisan migrate --seed` | Migrate and seed |
| `php artisan migrate:fresh --seed` | Rebuild local database |
| `php artisan storage:link` | Link public storage |
| `php artisan config:clear` | Clear cached configuration |
| `php artisan route:list` | Inspect API routes |
| `php artisan tinker` | Interactive shell |

---

## License

This project is provided for the Pawly Dog Rescue website. Third-party
packages retain their own licenses.
