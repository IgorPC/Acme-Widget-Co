<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Domain\Basket\Product;
use JsonSerializable;

final readonly class ProductData implements JsonSerializable
{
    public function __construct(
        public string $code,
        public string $name,
        public int $price,
    ) {}

    public static function fromProduct(Product $product): self
    {
        return new self($product->code, $product->name, $product->priceInCents);
    }

    /**
     * @return array{code: string, name: string, price: int}
     */
    public function jsonSerialize(): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'price' => $this->price,
        ];
    }
}