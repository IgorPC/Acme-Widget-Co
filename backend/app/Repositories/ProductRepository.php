<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Domain\Basket\Product;

interface ProductRepository
{
    /**
     * @return list<Product>
     */
    public function all(): array;
}