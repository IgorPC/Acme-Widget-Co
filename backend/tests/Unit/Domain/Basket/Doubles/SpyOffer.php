<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Basket\Doubles;

use App\Domain\Basket\Offers\Offer;
use App\Domain\Basket\Product;

/**
 * Offer that returns a fixed discount and records the items it receives on each call.
 */
final class SpyOffer implements Offer
{
    /** @var list<list<Product>> */
    public array $receivedItems = [];

    public function __construct(private readonly int $discount) {}

    public function discountFor(array $items): int
    {
        $this->receivedItems[] = $items;

        return $this->discount;
    }
}
