<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Basket\Delivery;

use App\Domain\Basket\Delivery\TieredDeliveryCharge;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class TieredDeliveryChargeTest extends TestCase
{

    /**
     * Rules from the specification: < 50.00 -> 4.95; < 90.00 -> 2.95; >= 90.00 -> free.
     *
     * @return array<string, array{int, int}>
     */
    public static function specificationTiers(): array
    {
        return [
            'zero' => [0, 495],
            'one cent' => [1, 495],
            'just below 50.00' => [4999, 495],
            'exactly 50.00' => [5000, 295],
            'one cent above 50.00' => [5001, 295],
            'just below 90.00' => [8999, 295],
            'exactly 90.00' => [9000, 0],
            'one cent above 90.00' => [9001, 0],
            'very large subtotal' => [PHP_INT_MAX, 0],
        ];
    }

    #[DataProvider('specificationTiers')]
    public function test_it_charges_according_to_the_specification_tiers(int $subtotal, int $expectedCharge): void
    {
        $delivery = new TieredDeliveryCharge([5000 => 495, 9000 => 295]);

        $this->assertSame($expectedCharge, $delivery->chargeFor($subtotal));
    }

    public function test_tiers_given_out_of_order_are_sorted_by_threshold(): void
    {
        $delivery = new TieredDeliveryCharge([9000 => 295, 5000 => 495]);

        $this->assertSame(495, $delivery->chargeFor(4999));
        $this->assertSame(295, $delivery->chargeFor(5000));
        $this->assertSame(0, $delivery->chargeFor(9000));
    }

    public function test_the_default_charge_applies_at_and_above_the_last_threshold(): void
    {
        $delivery = new TieredDeliveryCharge([5000 => 495, 9000 => 295], defaultCharge: 99);

        $this->assertSame(295, $delivery->chargeFor(8999));
        $this->assertSame(99, $delivery->chargeFor(9000));
        $this->assertSame(99, $delivery->chargeFor(1_000_000));
    }

    public function test_the_default_charge_is_zero_when_omitted(): void
    {
        $delivery = new TieredDeliveryCharge([100 => 10]);

        $this->assertSame(0, $delivery->chargeFor(100));
    }

    public function test_without_tiers_every_subtotal_gets_the_default_charge(): void
    {
        $delivery = new TieredDeliveryCharge([], defaultCharge: 350);

        $this->assertSame(350, $delivery->chargeFor(0));
        $this->assertSame(350, $delivery->chargeFor(100_000));
    }

    public function test_a_single_tier(): void
    {
        $delivery = new TieredDeliveryCharge([2000 => 500]);

        $this->assertSame(500, $delivery->chargeFor(1999));
        $this->assertSame(0, $delivery->chargeFor(2000));
    }

    public function test_a_negative_subtotal_falls_into_the_lowest_tier(): void
    {
        $delivery = new TieredDeliveryCharge([5000 => 495, 9000 => 295]);

        $this->assertSame(495, $delivery->chargeFor(-1));
    }

    public function test_many_tiers_pick_the_first_threshold_above_the_subtotal(): void
    {
        $delivery = new TieredDeliveryCharge([
            4000 => 300,
            1000 => 700,
            3000 => 400,
            2000 => 500,
        ], defaultCharge: 100);

        $this->assertSame(700, $delivery->chargeFor(999));
        $this->assertSame(500, $delivery->chargeFor(1000));
        $this->assertSame(500, $delivery->chargeFor(1999));
        $this->assertSame(400, $delivery->chargeFor(2000));
        $this->assertSame(300, $delivery->chargeFor(3999));
        $this->assertSame(100, $delivery->chargeFor(4000));
    }

    public function test_it_is_stateless_between_calls(): void
    {
        $delivery = new TieredDeliveryCharge([5000 => 495, 9000 => 295]);

        $this->assertSame(0, $delivery->chargeFor(9000));
        $this->assertSame(495, $delivery->chargeFor(0));
        $this->assertSame(0, $delivery->chargeFor(9000));
    }
}
