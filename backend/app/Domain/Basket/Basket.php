<?php

declare(strict_types=1);

namespace App\Domain\Basket;

use App\Domain\Basket\Delivery\DeliveryChargeRule;
use App\Domain\Basket\Offers\Offer;

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

    public function total(): int
    {
        if ($this->items === []) {
            return 0;
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

        return $afterDiscount + $this->deliveryRule->chargeFor($afterDiscount);
    }
}