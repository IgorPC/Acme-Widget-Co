<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Basket;

use App\Domain\Basket\BasketSummary;
use Error;
use PHPUnit\Framework\TestCase;

final class BasketSummaryTest extends TestCase
{
    public function test_it_exposes_every_amount(): void
    {
        $summary = new BasketSummary(items: ['R01', 'R01'], subtotal: 6590, discount: 1648, delivery: 495, total: 5437);

        $this->assertSame(['R01', 'R01'], $summary->items);
        $this->assertSame(6590, $summary->subtotal);
        $this->assertSame(1648, $summary->discount);
        $this->assertSame(495, $summary->delivery);
        $this->assertSame(5437, $summary->total);
    }

    public function test_it_accepts_an_all_zero_summary(): void
    {
        $summary = new BasketSummary(items: [], subtotal: 0, discount: 0, delivery: 0, total: 0);

        $this->assertSame([], $summary->items);
        $this->assertSame(0, $summary->total);
    }

    public function test_it_is_immutable(): void
    {
        $summary = new BasketSummary(items: [], subtotal: 0, discount: 0, delivery: 0, total: 0);

        $this->expectException(Error::class);
        $this->expectExceptionMessage('Cannot modify readonly property');

        $summary->total = 1;
    }

    public function test_its_items_cannot_be_changed_from_outside(): void
    {
        $items = ['R01'];
        $summary = new BasketSummary(items: $items, subtotal: 3295, discount: 0, delivery: 495, total: 3790);

        $items[] = 'G01';

        $this->assertSame(['R01'], $summary->items);
    }
}
