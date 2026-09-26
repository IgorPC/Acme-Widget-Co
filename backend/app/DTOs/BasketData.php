<?php

declare(strict_types=1);

namespace App\DTOs;

use JsonSerializable;
use App\Domain\Basket\BasketSummary;

final readonly class BasketData implements JsonSerializable
{
    /**
     * @param  list<string>  $items 
     */
    public function __construct(
        public array $items,
        public int $total,
        public int $subtotal,
        public int $discount,
        public int $delivery
    ) {}

    public static function fromSummary(BasketSummary $summary): self
    {
        return new self(
            items: $summary->items,
            subtotal: $summary->subtotal,
            discount: $summary->discount,
            delivery: $summary->delivery,
            total: $summary->total,
        );
    }

    /**
     * @return array{ items: list<string>, total: int, subtotal: int, discount: int, delivery: int }
     */
    public function jsonSerialize(): array
    {
        return [
            'items' => $this->items,
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'delivery' => $this->delivery,
            'total' => $this->total,
        ];
    }
}