<?php

declare(strict_types=1);

namespace App\Domain\Basket\Delivery;

interface DeliveryChargeRule 
{
    public function chargeFor(int $subtotalInCents): int;
}