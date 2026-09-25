<?php

declare(strict_types=1);

namespace App\Domain\Basket;

use App\Domain\Basket\Exceptions\UnknownProductException;
use InvalidArgumentException;

final class ProductCatalogue
{
    /** @var array<string, Product> */
    private array $products = [];

    /**
     * @param  list<Product>  $products
     *
     * @throws InvalidArgumentException when two products share the same code
     */
    public function __construct(array $products)
    {
        foreach ($products as $product) {
            if (isset($this->products[$product->code])) {
                throw new InvalidArgumentException("Duplicate product code [{$product->code}].");
            }

            $this->products[$product->code] = $product;
        }
    }

    public function find(string $code): Product
    {
        return $this->products[$code] ?? throw UnknownProductException::forCode($code);
    }

    
    /**
     * @return list<Product>
     */
    public function all() : array
    {
        return array_values($this->products);
    }

    /**
     * @return list<string>
     */
    public function codes(): array
    {
        return array_keys($this->products);
    }
}