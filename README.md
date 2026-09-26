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

   *Why a limit:* the API is public and stateless, so every request carries the whole
   basket and is recalculated from scratch. Without a limit, a single request with
   millions of codes would make the server allocate and loop over all of them (each
   offer scans the whole list), which is an easy way to exhaust memory or CPU. A
   bound keeps the cost of one request predictable. 100 is far above any realistic
   order of widgets in this proof of concept, so it never gets in the way of a real
   customer.

   *Why only in the API and UI:* the limit is a protection of the HTTP endpoint, not a
   business rule, and the specification defines no maximum. It is therefore enforced
   by `CalculateBasketRequest` (`'items' => ['present', 'array', 'max:100']`) and
   mirrored in the UI, while `Basket` itself accepts any number of items. If the
   business ever defines a real maximum order size, it should move into the domain.

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
docker compose build
```

Dependencies (`composer install`, `npm install`) are installed inside the containers
the first time they start.

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
docker compose up -d
```

Stop it with `docker compose down`. To rebuild the images after changing a
`Dockerfile`, run `docker compose up -d --build`.

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

## How it works

```
React UI ──POST /api/basket {"items": [...]}──▶ ProductController ──▶ BasketService
                                                                        │
                        ProductRepository (config/acme.php) ◀───────────┤  1. load products
                        BasketFactory ──▶ Basket (domain) ◀─────────────┤  2. add() each code
                                                                        │  3. summary() / total()
React UI ◀──────────────── JSON ◀──── BasketData (DTO) ◀────────────────┘
```

The pricing rules live in a small **domain layer** written in plain PHP
(`backend/app/Domain/Basket`, no Laravel classes). Laravel is only the HTTP layer
around it, and the React UI never calculates prices: it sends the list of product
codes and displays what the API returns.

### The domain

| Class | Responsibility |
|---|---|
| `Product` | Immutable value object: `code`, `name`, `priceInCents`. Rejects negative prices. |
| `ProductCatalogue` | The products the basket can sell, indexed by code. `find($code)` throws `UnknownProductException` for unknown codes; duplicate codes are rejected when it is built. |
| `Offer` (interface) | `discountFor(array $items): int` — receives every product in the basket and returns a discount in cents. |
| `BuyOneGetSecondHalfPrice` | The initial offer. For each **pair** of the configured product, the second one costs `floor(price / 2)`. |
| `DeliveryChargeRule` (interface) | `chargeFor(int $subtotalInCents): int` — the delivery charge for an amount. |
| `TieredDeliveryCharge` | Delivery by tiers: "below X cents costs Y cents", plus a default charge above the last tier. |
| `Basket` | The interface the specification asks for: built with a catalogue, a delivery rule and a list of offers; `add(string $productCode)`; `total(): int`. `summary()` returns the breakdown used by the UI. |
| `BasketSummary` | Immutable result of a calculation: `items`, `subtotal`, `discount`, `delivery`, `total`. |
| `BasketFactory` | Creates a new, empty `Basket` for each request with the configured rules. |

The calculation, in `Basket::summary()`:

1. `subtotal` = sum of the prices of every product added;
2. `discount` = sum of `discountFor()` of every offer;
3. `delivery` = `chargeFor(subtotal − discount)`;
4. `total` = `subtotal − discount + delivery`.

Using the basket directly, exactly as the specification describes it:

```php
$basket = new Basket(
    new ProductCatalogue([
        new Product('R01', 'Red Widget', 3295),
        new Product('G01', 'Green Widget', 2495),
        new Product('B01', 'Blue Widget', 795),
    ]),
    new TieredDeliveryCharge([5000 => 495, 9000 => 295]),
    [new BuyOneGetSecondHalfPrice('R01')],
);

$basket->add('R01');
$basket->add('R01');
$basket->total(); // 5437 ($54.37)
```

### Configuration and wiring

- **`backend/config/acme.php`** holds the catalogue, the delivery tiers and the
  active offers. Changing a price or a tier does not require touching any class.
- **`ProductRepository`** is the connection to the product data. The only
  implementation, `ConfigProductRepository`, reads `config/acme.php`; a database
  could be supported by adding another implementation and changing one binding.
- **`AppServiceProvider`** builds the delivery rule and the offers from the config
  and registers the `BasketFactory`.
- **`BasketService`** runs a calculation: loads the products through the repository,
  gets a new basket from the factory, adds each code and returns a `BasketData` DTO.
- **`ProductController`** only deals with HTTP: it validates the input with
  `CalculateBasketRequest` and returns the DTO as JSON.

### Adding a new offer

1. Implement `Offer` in `backend/app/Domain/Basket/Offers/`, for example "buy two,
   get the third free":

   ```php
   final readonly class BuyTwoGetOneFree implements Offer
   {
       public function __construct(private string $productCode) {}

       public function discountFor(array $items): int
       {
           $matching = array_values(array_filter(
               $items,
               fn (Product $product): bool => $product->code === $this->productCode,
           ));

           $freeItems = intdiv(count($matching), 3);

           return $freeItems === 0 ? 0 : $freeItems * $matching[0]->priceInCents;
       }
   }
   ```

2. Add it to `config/acme.php`:

   ```php
   'offers' => [
       'buy_one_get_second_half_price' => ['R01'],
       'buy_two_get_one_free' => ['G01'],
   ],
   ```

3. Register it in `AppServiceProvider`, replacing the offers argument of the
   `BasketFactory` (and importing `Offer` and `BuyTwoGetOneFree`):

   ```php
   array_merge(
       array_map(
           fn (string $code): Offer => new BuyOneGetSecondHalfPrice($code),
           config('acme.offers.buy_one_get_second_half_price', []),
       ),
       array_map(
           fn (string $code): Offer => new BuyTwoGetOneFree($code),
           config('acme.offers.buy_two_get_one_free', []),
       ),
   ),
   ```

`Basket` does not change: it sums the discounts of every offer it receives. With the
example above, `G01, G01, G01` has a subtotal of $74.85, a discount of $24.95,
$4.95 delivery (the discounted amount, $49.90, is under $50) and a total of $54.85.
A new delivery rule works the same way: implement `DeliveryChargeRule` and bind it
in `AppServiceProvider`.

### API

`GET /api/products`

```json
{
  "data": [
    { "code": "R01", "name": "Red Widget", "price": 3295 },
    { "code": "G01", "name": "Green Widget", "price": 2495 },
    { "code": "B01", "name": "Blue Widget", "price": 795 }
  ]
}
```

`POST /api/basket`

```bash
curl -X POST http://localhost:8000/api/basket \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"items": ["R01", "R01"]}'
```

```json
{
  "data": {
    "items": ["R01", "R01"],
    "subtotal": 6590,
    "discount": 1648,
    "delivery": 495,
    "total": 5437
  }
}
```

All amounts are in cents. Errors share one shape, `{ "message": ..., "errors": ... }`:

| Request | Status | Response |
|---|---|---|
| `{"items": ["X99"]}` | 422 | `{"message": "Unknown product code [X99].", "errors": null}` |
| `{}` or `{"items": "R01"}` | 422 | `{"message": "Validation error.", "errors": {"items": [...]}}` |
| More than 100 items | 422 | `{"message": "Validation error.", "errors": {"items": [...]}}` |

### Frontend

`frontend/src` has one page (`pages/BasketPage.tsx`), MUI components
(`components/`) and three hooks: `useProducts` loads the catalogue,
`useBasketItems` keeps the list of codes in the order they were added, and
`useBasketTotal` sends that list to `POST /api/basket` on every change and ignores
responses that arrive after the basket has changed. The line totals shown in the
basket (`$24.95 × 3 = $74.85`) are display-only; offers and delivery are applied by
the API and appear in the summary.

