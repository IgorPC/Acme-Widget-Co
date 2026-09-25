<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Basket\Offers;

use App\Domain\Basket\Offers\BuyOneGetSecondHalfPrice;
use App\Domain\Basket\Product;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class BuyOneGetSecondHalfPriceTest extends TestCase
{

    public function test_no_items_means_no_discount(): void
    {
        $this->assertSame(0, (new BuyOneGetSecondHalfPrice('R01'))->discountFor([]));
    }

    /**
     * R01 = 3295. Discount per pair = 3295 - intdiv(3295, 2) = 1648 (the customer pays 1647 for the second one).
     *
     * @return array<string, array{int, int}>
     */
    public static function quantities(): array
    {
        return [
            'one item: no pair' => [1, 0],
            'two items: one pair' => [2, 1648],
            'three items: one pair' => [3, 1648],
            'four items: two pairs' => [4, 2 * 1648],
            'five items: two pairs' => [5, 2 * 1648],
            'hundred items: fifty pairs' => [100, 50 * 1648],
        ];
    }

    #[DataProvider('quantities')]
    public function test_it_discounts_once_per_complete_pair(int $quantity, int $expectedDiscount): void
    {
        $items = array_fill(0, $quantity, $this->red());

        $this->assertSame($expectedDiscount, (new BuyOneGetSecondHalfPrice('R01'))->discountFor($items));
    }

    /**
     * @return array<string, array{int, int}>
     */
    public static function prices(): array
    {
        return [
            'even price halves exactly' => [1000, 500],
            'odd price: rounding favours the customer' => [3295, 1648],
            'one cent: second item is free' => [1, 1],
            'two cents' => [2, 1],
            'zero price' => [0, 0],
        ];
    }

    #[DataProvider('prices')]
    public function test_the_discount_per_pair_is_half_the_price_rounded_up(int $price, int $expectedDiscount): void
    {
        $items = [new Product('X01', 'Widget', $price), new Product('X01', 'Widget', $price)];

        $this->assertSame($expectedDiscount, (new BuyOneGetSecondHalfPrice('X01'))->discountFor($items));
    }

    public function test_the_customer_pays_the_rounded_down_half_for_the_second_item(): void
    {
        $items = [$this->red(), $this->red()];

        $discount = (new BuyOneGetSecondHalfPrice('R01'))->discountFor($items);

        $this->assertSame(3295 + 1647, 2 * 3295 - $discount);
    }

    public function test_other_products_are_ignored(): void
    {
        $items = [$this->green(), $this->blue(), $this->green(), $this->blue()];

        $this->assertSame(0, (new BuyOneGetSecondHalfPrice('R01'))->discountFor($items));
    }

    public function test_one_matching_item_among_others_is_not_a_pair(): void
    {
        $items = [$this->red(), $this->green(), $this->blue()];

        $this->assertSame(0, (new BuyOneGetSecondHalfPrice('R01'))->discountFor($items));
    }

    public function test_matching_items_do_not_need_to_be_adjacent(): void
    {
        $items = [$this->red(), $this->green(), $this->blue(), $this->red()];

        $this->assertSame(1648, (new BuyOneGetSecondHalfPrice('R01'))->discountFor($items));
    }

    public function test_the_first_item_is_not_a_matching_product(): void
    {
        $items = [$this->blue(), $this->red(), $this->red()];

        $this->assertSame(1648, (new BuyOneGetSecondHalfPrice('R01'))->discountFor($items));
    }

    public function test_it_works_for_any_configured_product(): void
    {
        $items = [$this->green(), $this->green(), $this->red(), $this->red()];

        // 2495 - intdiv(2495, 2) = 1248; the R01 items are ignored.
        $this->assertSame(1248, (new BuyOneGetSecondHalfPrice('G01'))->discountFor($items));
    }

    public function test_the_product_code_is_case_sensitive(): void
    {
        $items = [$this->red(), $this->red()];

        $this->assertSame(0, (new BuyOneGetSecondHalfPrice('r01'))->discountFor($items));
    }

    public function test_numeric_looking_codes_are_compared_strictly(): void
    {
        // With loose comparison (==), '100' and '1e2' would be the same product.
        $items = [new Product('1e2', 'Widget', 1000), new Product('1e2', 'Widget', 1000)];

        $this->assertSame(0, (new BuyOneGetSecondHalfPrice('100'))->discountFor($items));
    }

    public function test_it_does_not_modify_the_items_it_receives(): void
    {
        $items = [$this->red(), $this->green(), $this->red()];
        $copy = $items;

        (new BuyOneGetSecondHalfPrice('R01'))->discountFor($items);

        $this->assertSame($copy, $items);
    }

    public function test_it_is_stateless_between_calls(): void
    {
        $offer = new BuyOneGetSecondHalfPrice('R01');

        $this->assertSame(1648, $offer->discountFor([$this->red(), $this->red()]));
        $this->assertSame(0, $offer->discountFor([$this->red()]));
        $this->assertSame(1648, $offer->discountFor([$this->red(), $this->red()]));
    }

    private function red(): Product
    {
        return new Product('R01', 'Red Widget', 3295);
    }

    private function green(): Product
    {
        return new Product('G01', 'Green Widget', 2495);
    }

    private function blue(): Product
    {
        return new Product('B01', 'Blue Widget', 795);
    }
}
