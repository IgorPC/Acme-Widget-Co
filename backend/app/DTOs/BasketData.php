<?php

declare(strict_types=1);

namespace App\DTOs;

use JsonSerializable;

final readonly class BasketData implements JsonSerializable
{
    /**
     * @param  list<string>  $items 
     */
    public function __construct(
        public array $items,
        public int $total,
    ) {}

    /**
     * @return array{items: list<string>, total: int}
     */
    public function jsonSerialize(): array
    {
        return [
            'items' => $this->items,
            'total' => $this->total,
        ];
    }
}