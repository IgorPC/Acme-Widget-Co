<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Basket;

use App\Domain\Basket\Product;
use Error;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class ProductTest extends TestCase
{
    public function test_it_exposes_code_name_and_price(): void
    {
        $product = new Product('R01', 'Red Widget', 3295);

        $this->assertSame('R01', $product->code);
        $this->assertSame('Red Widget', $product->name);
        $this->assertSame(3295, $product->priceInCents);
    }

    public function test_a_zero_price_is_allowed(): void
    {
        $product = new Product('F01', 'Free Widget', 0);

        $this->assertSame(0, $product->priceInCents);
    }

    public function test_the_largest_integer_price_is_allowed(): void
    {
        $product = new Product('X01', 'Expensive Widget', PHP_INT_MAX);

        $this->assertSame(PHP_INT_MAX, $product->priceInCents);
    }

    /**
     * @return array<string, array{int}>
     */
    public static function negativePrices(): array
    {
        return [
            'minus one cent' => [-1],
            'minus one dollar' => [-100],
            'smallest integer' => [PHP_INT_MIN],
        ];
    }

    #[DataProvider('negativePrices')]
    public function test_a_negative_price_is_rejected(int $price): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Price cannot be negative.');

        new Product('R01', 'Red Widget', $price);
    }

    public function test_it_is_immutable(): void
    {
        $product = new Product('R01', 'Red Widget', 3295);

        $this->expectException(Error::class);
        $this->expectExceptionMessage('Cannot modify readonly property');

        /** @phpstan-ignore-next-line */
        $product->priceInCents = 1;
    }

    public function test_it_keeps_code_and_name_exactly_as_given(): void
    {
        $product = new Product(' r01 ', 'Réd Wídget ✓', 1);

        $this->assertSame(' r01 ', $product->code);
        $this->assertSame('Réd Wídget ✓', $product->name);
    }
}
