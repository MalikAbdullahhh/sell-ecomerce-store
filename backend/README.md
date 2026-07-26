# Aperture API

Express + MongoDB backend for Focus Frame Store / Aperture.

## Setup

1. Copy `.env.example` → `.env` and fill values (MongoDB, SMTP, JWT secrets).
2. Ensure MongoDB is running locally (or set `MONGODB_URI`).
3. Install & seed:

```bash
npm install
npm run seed
npm run dev
```

API: `http://localhost:5000`

Default admin (from `.env`):

- Email: `admin@aperture.tech`
- Password: `Admin@12345`

## Key routes

| Method | Path                       | Notes                                  |
| ------ | -------------------------- | -------------------------------------- |
| GET    | `/api/health`              | Health check                           |
| POST   | `/api/auth/register`       | User signup                            |
| POST   | `/api/auth/login`          | User login                             |
| POST   | `/api/auth/admin/login`    | Admin login                            |
| GET    | `/api/products`            | Catalogue                              |
| GET    | `/api/products/slug/:slug` | Product + reviews                      |
| POST   | `/api/orders`              | Place order (COD / online QR)          |
| GET    | `/api/orders/mine`         | Logged-in order history                |
| GET    | `/api/cms/site`            | Contact, socials, payment QR, shipping |
| *      | `/api/admin/*`             | Dashboard stats & users                |

Uploads are served from `/uploads`.
