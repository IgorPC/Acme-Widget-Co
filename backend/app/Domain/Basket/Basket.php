<?php

declare(strict_types=1);

namespace App\Domain\Basket;

use App\Domain\Basket\Delivery\DeliveryChargeRule;
use App\Domain\Basket\Offers\Offer;
use App\Domain\Basket\BasketSummary;

final class Basket
{
    /** @var list<Product> */
    private array $items = [];

        /**
     * @param  list<Offer>  $offers
     */
    public function __construct(
        private readonly ProductCatalogue $catalogue,
        private readonly DeliveryChargeRule $deliveryRule,
        private readonly array $offers = [],
    ) {}

    public function add(string $productCode): void
    {
        $this->items[] = $this->catalogue->find($productCode);
    }

    public function summary(): BasketSummary
    {
        if ($this->items === []) {
            return new BasketSummary(items: [], subtotal: 0, discount: 0, delivery: 0, total: 0);
        }

        $subtotal = array_sum(array_map(
            fn (Product $product): int => $product->priceInCents,
            $this->items,
        ));

        $discount = array_sum(array_map(
            fn (Offer $offer): int => $offer->discountFor($this->items),
            $this->offers,
        ));

        $afterDiscount = $subtotal - $discount;
        $delivery = $this->deliveryRule->chargeFor($afterDiscount);

        return new BasketSummary(
            items: array_map(fn (Product $product): string => $product->code, $this->items),
            subtotal: $subtotal,
            discount: $discount,
            delivery: $delivery,
            total: $afterDiscount + $delivery,
        );
    }

    public function total(): int
    {
        return $this->summary()->total;
    }
}