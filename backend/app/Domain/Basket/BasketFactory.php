<?php

declare(strict_types=1);

namespace App\Domain\Basket;

use App\Domain\Basket\Delivery\DeliveryChargeRule;
use App\Domain\Basket\Offers\Offer;

final readonly class BasketFactory
{
    /**
     * @param  list<Offer>  $offers
     */
    public function __construct(
        private DeliveryChargeRule $deliveryRule,
        private array $offers = [],
    ) {}

    public function make(ProductCatalogue $catalogue): Basket
    {
        return new Basket($catalogue, $this->deliveryRule, $this->offers);
    }
}