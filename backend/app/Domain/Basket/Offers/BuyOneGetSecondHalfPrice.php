<?php

declare(strict_types=1);

namespace App\Domain\Basket\Offers;

use App\Domain\Basket\Product;

final readonly class BuyOneGetSecondHalfPrice implements Offer 
{
    private string $productCode;

    public function __construct(string $productCode) {
        $this->productCode = $productCode;
    }

    public function discountFor(array $items): int
    {
        $matching = array_values(array_filter(
            $items,
            fn (Product $product): bool => $product->code === $this->productCode,
        ));

        $pairs = intdiv(count($matching), 2);

        if ($pairs === 0) {
            return 0;
        }

        $price = $matching[0]->priceInCents;

        return $pairs * ($price - intdiv($price, 2)); // rounding favours the customer.
    }
}