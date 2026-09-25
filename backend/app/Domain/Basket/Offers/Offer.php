<?php

declare(strict_types=1);

namespace App\Domain\Basket\Offers;

use App\Domain\Basket\Product;

interface Offer 
{
     /**
     * @param  list<Product>  $items 
     * @return int 
     */
    public function discountFor(array $items): int;
}