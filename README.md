# Acme Widget Co

![CI](https://github.com/IgorPC/Acme-Widget-Co/actions/workflows/ci.yml/badge.svg)

Proof of concept of the Acme Widget Co sales basket.

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
   `UnknownProductException`. The API validates codes against the catalogue and
   returns HTTP 422 before the basket is built.
8. **Product codes in the catalogue must be unique.** Building a catalogue with two
   products sharing a code throws `InvalidArgumentException` instead of silently
   keeping one of them, since that is almost certainly a configuration mistake.

## Requirements

- PHP 8.3+ and Composer
- Node.js 20.19+ (or 22.12+) and npm

## Running locally

Backend (http://localhost:8000):

```bash
cd backend
composer setup      # composer install + .env + app key
php artisan serve
```

Frontend (http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

In development, Vite proxies `/api/*` (and Laravel's `/up` health check) to the
backend, so the frontend calls relative paths and no CORS setup is needed.
The backend URL can be changed with `VITE_BACKEND_URL` in `frontend/.env`
(see `frontend/.env.example`).

## Tests

```bash
cd backend && composer test
```
