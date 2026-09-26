<?php

declare(strict_types=1);

namespace App\Domain\Basket;

final readonly class BasketSummary
{
    /**
     * @param  list<string>  $items 
     */
    public function __construct(
        public array $items,
        public int $subtotal,
        public int $discount,
        public int $delivery,
        public int $total,
    ) {}
}