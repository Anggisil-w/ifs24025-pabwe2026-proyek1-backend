# Mulak Jabu — Back-end

REST API untuk platform manajemen dan pemesanan homestay lokal. Proyek 1 PABWE 2026, Institut Teknologi Del.

Repository ini hanya berisi **back-end**. Front-end (SvelteKit) ada di repository terpisah: `ifs24025-pabwe2026-proyek1-frontend`.

## Teknologi

| Lapisan | Teknologi |
| --- | --- |
| Server | Express.js (Node.js 20+) |
| Database | SQLite (`better-sqlite3`) |
| Validasi | Zod |
| CI/CD | Jenkins + SonarQube |

## Struktur

```
.
├── src/
│   ├── controllers/   routes/   middleware/   validators/
│   ├── db/            # schema.sql, seed, auto-seed
│   └── utils/
├── docs/ERD.md
├── api.http           # contoh request (ekstensi VS Code "REST Client")
├── Jenkinsfile
└── sonar-project.properties
```

## Menjalankan Secara Lokal

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run seed              # membuat tabel dan mengisi data awal
npm start                 # http://localhost:3000/api
```

Cek server: <http://localhost:3000/api/health>

Akun demo hasil seed: `admin@mulakjabu.test` (password default `Admin12345`, ubah lewat `SEED_ADMIN_PASSWORD`) dan `tamu@mulakjabu.test`.

## Variabel Environment

| Variabel | Contoh | Keterangan |
| --- | --- | --- |
| `PORT` | `3000` | Port server |
| `DB_PATH` | `./data/mulakjabu.db` | Lokasi file SQLite |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin front-end yang diizinkan (pisahkan dengan koma) |
| `JWT_SECRET` | — | Wajib di produksi, minimal 16 karakter |
| `SEED_ADMIN_PASSWORD` | — | Opsional, password admin saat seed |
| `AUTO_SEED` | `true` | Isi data contoh otomatis jika database kosong |

## Endpoint (prefix `/api`)

Autentikasi memakai header `Authorization: Bearer <token>`.

| Method | Endpoint | Akses |
| --- | --- | --- |
| GET | `/health` | Publik |
| POST | `/auth/register`, `/auth/login` | Publik |
| GET | `/auth/me` | Login |
| GET | `/homestays`, `/homestays/:id`, `/homestays/:id/rooms` | Publik |
| POST, PUT, DELETE | `/homestays`, `/homestays/:id` | Admin |
| GET | `/rooms`, `/rooms/:id` | Publik |
| POST, PUT, DELETE | `/rooms`, `/rooms/:id` | Admin |
| GET, POST | `/bookings` | Login (tamu hanya melihat pesanannya sendiri) |
| GET, PUT | `/bookings/:id` | Login |
| PATCH | `/bookings/:id/status` | Login |
| DELETE | `/bookings/:id` | Admin |

Contoh request lengkap ada di `api.http`. Skema database ada di `docs/ERD.md`.

Format error seragam:

```json
{ "error": { "message": "Pesan error", "details": [] } }
```

## Deployment

- Atur `CORS_ORIGIN` ke URL front-end publik dan `JWT_SECRET` ke nilai acak.
- SQLite memakai file lokal. Di hosting dengan disk sementara, pasang volume persisten dan arahkan `DB_PATH` ke sana agar data tidak hilang saat deploy ulang.
