<?php

declare(strict_types=1);

namespace App\Domain\Basket;

use InvalidArgumentException;

final readonly class Product 
{
    public string $code;
    public string $name;
    public int $priceInCents;


    public function __construct(string $code, string $name, int $priceInCents)
    {
        if ($priceInCents < 0) {
            throw new InvalidArgumentException('Price cannot be negative.');
        }

        $this->code = $code;
        $this->name = $name;
        $this->priceInCents = $priceInCents;
    }
}