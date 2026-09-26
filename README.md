# Acme Widget Co

![CI](https://github.com/IgorPC/Acme-Widget-Co/actions/workflows/ci.yml/badge.svg)

Proof of concept of the Acme Widget Co sales basket.

**Live demo:** [acme-widget.igorcoutinho.com](https://acme-widget.igorcoutinho.com)

| Folder | Stack |
|---|---|
| `backend/` | Laravel 13 (PHP 8.3+), API only, no database |
| `frontend/` | React 19 + TypeScript + Vite 8 |

## Assumptions

The specification leaves some rules open. These are the decisions I made, and why.

1. **Money is handled as integer cents.** Prices, discounts, delivery charges and
   totals are `int` cents (e.g. `3295` for $32.95) to avoid floating-point errors.
   `Basket::total()` returns cents (`5437`); the UI formats it as `$54.37`.
2. **Half-price rounding favours the customer.** Half of $32.95 is $16.475. The
   discounted Red Widget is charged `floor(3295 / 2) = 1647` cents ($16.47), so the
   discount is $16.48. The expected total for `R01, R01` ($54.37) requires this;
   ordinary half-up rounding would give $54.38. Truncating only the final total would
   also match the examples, but rounding inside the offer keeps every intermediate
   amount a whole number of cents.
3. **Delivery is charged on the amount after offers.** Delivery "is reduced based on
   the amount spent", so the delivery tier is chosen from the subtotal after
   discounts: `total = (subtotal − discounts) + delivery(subtotal − discounts)`.
   For `R01, R01`: $65.90 − $16.48 = $49.42, which is under $50, so delivery is
   $4.95 and the total is $54.37. Using the pre-discount subtotal would give $52.37.
4. **The offer applies to every pair of Red Widgets.** 2 red widgets → 1 at half
   price, 3 → 1, 4 → 2. The examples confirm that a third red widget is full price
   but don't cover four; applying the offer per pair is the usual reading of
   "buy one, get the second half price".
5. **Delivery tiers:** under $50.00 → $4.95; from $50.00 to $89.99 → $2.95;
   $90.00 or more → free. An order of exactly $50.00 pays $2.95.
6. **An empty basket costs $0.00.** A literal reading ("orders under $50 cost
   $4.95") would charge delivery for nothing; no delivery is charged when there is
   nothing to ship.
7. **Unknown product codes are rejected.** `Basket::add('X99')` throws
   `UnknownProductException`. The service creates the basket and adds each code in
   turn; if a code is unknown, calculation stops and the API returns HTTP 422.
8. **Product codes in the catalogue must be unique.** Building a catalogue with two
   products sharing a code throws `InvalidArgumentException` instead of silently
   keeping one of them, since that is almost certainly a configuration mistake.
9. **The API and UI limit baskets to 100 items.** The API rejects requests with
   more than 100 product codes with HTTP 422, and the UI disables the Add buttons
   and explains the limit once the basket reaches 100 items.

> [!IMPORTANT]
> **10. The basket is not persisted.** The items live in the React state of the
> page, and the backend is stateless: every change sends the whole list of codes to
> `POST /api/basket`, which calculates the total and keeps nothing. Reloading the
> page or opening it in another tab starts with an empty basket. The specification
> only asks for `add` and `total`, so persistence was left out of this proof of
> concept.
>
> A persistent basket could be stored server-side in **Redis**: create a basket id
> when the first product is added, keep the list of codes under a key such as
> `basket:{id}` with a TTL (for example 7 days), and send the id in a cookie or
> header. Redis fits well because a basket is small, short-lived, read and written
> on every click, and does not need relational queries. Keeping the id in
> `localStorage` would be enough for a single browser, but not for sharing a basket
> across devices.

## Requirements

- PHP 8.3+ and Composer
- Node.js 20.19+ (or 22.12+) and npm
- Docker (optional)

## How to install

### Without Docker

```bash
cd backend
composer setup      # composer install + .env + app key

cd ../frontend
npm install
```

### With Docker

```bash
docker compose up --build
```

## Running locally

### Without Docker

Backend:

```bash
cd backend
php artisan serve
```

Frontend:

```bash
cd frontend
npm run dev
```

### With Docker

```bash
docker-compose up -d
```

Stop it with `docker-compose down`.

### Local URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api |
| Products | `GET http://localhost:8000/api/products` |
| Basket total | `POST http://localhost:8000/api/basket` |
| Health check | `GET http://localhost:8000/up` |

The frontend proxies `/api/*` to the backend, so no CORS setup is needed. The
backend URL can be changed with `VITE_BACKEND_URL` (see `frontend/.env.example`).

## Tests

Backend:

```bash
cd backend
composer test
```

Frontend:

```bash
cd frontend
npm test
```

Frontend with coverage:

```bash
cd frontend
npm run test:coverage
```
