<?php

declare(strict_types=1);

namespace App\Domain\Basket\Delivery;

final readonly class TieredDeliveryCharge implements DeliveryChargeRule 
{
    
    /** @var array<int, int> */
    private array $tiers;
    private int $defaultCharge;

    public function __construct(array $tiers, int $defaultCharge = 0)
    {
        ksort($tiers);
        $this->tiers = $tiers;
        $this->defaultCharge = $defaultCharge;
    }

    public function chargeFor(int $subtotalInCents): int
    {
        foreach ($this->tiers as $below => $charge) {
            if ($subtotalInCents < $below) {
                return $charge;
            }
        }
        return $this->defaultCharge;
    }
}