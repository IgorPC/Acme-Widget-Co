<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Basket\Doubles;

use App\Domain\Basket\Delivery\DeliveryChargeRule;

/**
 * Delivery rule that returns a fixed charge and records every subtotal it receives.
 */
final class SpyDeliveryChargeRule implements DeliveryChargeRule
{
    /** @var list<int> */
    public array $receivedSubtotals = [];

    public function __construct(private readonly int $charge) {}

    public function chargeFor(int $subtotalInCents): int
    {
        $this->receivedSubtotals[] = $subtotalInCents;

        return $this->charge;
    }
}
