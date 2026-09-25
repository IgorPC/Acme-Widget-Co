<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Basket;

use App\Domain\Basket\Basket;
use App\Domain\Basket\Delivery\TieredDeliveryCharge;
use App\Domain\Basket\Exceptions\UnknownProductException;
use App\Domain\Basket\Offers\BuyOneGetSecondHalfPrice;
use App\Domain\Basket\Product;
use App\Domain\Basket\ProductCatalogue;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Tests\Unit\Domain\Basket\Doubles\SpyDeliveryChargeRule;
use Tests\Unit\Domain\Basket\Doubles\SpyOffer;

final class BasketTest extends TestCase
{
    /**
     * @return array<string, array{list<string>, int}>
     */
    public static function exampleBaskets(): array
    {
        return [
            'B01, G01' => [['B01', 'G01'], 3785],
            'R01, R01' => [['R01', 'R01'], 5437],
            'R01, G01' => [['R01', 'G01'], 6085],
            'B01, B01, R01, R01, R01' => [['B01', 'B01', 'R01', 'R01', 'R01'], 9827],
        ];
    }

    /**
     * @param  list<string>  $codes
     */
    #[DataProvider('exampleBaskets')]
    public function test_it_matches_the_examples_from_the_specification(array $codes, int $expectedTotal): void
    {
        $basket = $this->makeBasket();

        foreach ($codes as $code) {
            $basket->add($code);
        }

        $this->assertSame($expectedTotal, $basket->total());
    }

    /**
     * More scenarios with the real catalogue and rules, calculated by hand:
     * R01 = 3295, G01 = 2495, B01 = 795; the second R01 costs 1647.
     *
     * @return array<string, array{list<string>, int}>
     */
    public static function additionalBaskets(): array
    {
        return [
            'single B01 (cheapest item, highest delivery)' => [['B01'], 795 + 495],
            'single G01' => [['G01'], 2495 + 495],
            'single R01 (offer needs two)' => [['R01'], 3295 + 495],
            'three R01 (only one pair discounted)' => [['R01', 'R01', 'R01'], 3295 + 1647 + 3295 + 295],
            'four R01 (two pairs, crosses free delivery)' => [['R01', 'R01', 'R01', 'R01'], 2 * (3295 + 1647)],
            'G01 x2 (no offer on green)' => [['G01', 'G01'], 4990 + 495],
            'G01 x3 (reaches middle tier)' => [['G01', 'G01', 'G01'], 7485 + 295],
            'G01 x4 (reaches free delivery)' => [['G01', 'G01', 'G01', 'G01'], 9980],
            'one of each' => [['R01', 'G01', 'B01'], 3295 + 2495 + 795 + 295],
            'R01 pair split by other items' => [['R01', 'B01', 'G01', 'R01'], 3295 + 1647 + 795 + 2495 + 295],
        ];
    }

    /**
     * @param  list<string>  $codes
     */
    #[DataProvider('additionalBaskets')]
    public function test_it_totals_other_baskets_with_the_real_rules(array $codes, int $expectedTotal): void
    {
        $basket = $this->makeBasket();

        foreach ($codes as $code) {
            $basket->add($code);
        }

        $this->assertSame($expectedTotal, $basket->total());
    }

    public function test_an_empty_basket_costs_nothing_and_charges_no_delivery(): void
    {
        $this->assertSame(0, $this->makeBasket()->total());
    }

    public function test_an_empty_basket_does_not_consult_the_delivery_rule_or_offers(): void
    {
        $delivery = new SpyDeliveryChargeRule(495);
        $offer = new SpyOffer(0);

        $basket = new Basket($this->catalogue(), $delivery, [$offer]);

        $this->assertSame(0, $basket->total());
        $this->assertSame([], $delivery->receivedSubtotals);
        $this->assertSame([], $offer->receivedItems);
    }

    public function test_adding_an_unknown_product_throws(): void
    {
        $basket = $this->makeBasket();

        $this->expectException(UnknownProductException::class);
        $this->expectExceptionMessage('Unknown product code [X99].');

        $basket->add('X99');
    }

    public function test_product_codes_are_case_sensitive(): void
    {
        $basket = $this->makeBasket();

        $this->expectException(UnknownProductException::class);

        $basket->add('r01');
    }

    public function test_an_empty_product_code_is_rejected(): void
    {
        $basket = $this->makeBasket();

        $this->expectException(UnknownProductException::class);

        $basket->add('');
    }

    public function test_a_failed_add_does_not_change_the_basket(): void
    {
        $basket = $this->makeBasket();
        $basket->add('B01');

        try {
            $basket->add('X99');
            $this->fail('Expected UnknownProductException.');
        } catch (UnknownProductException) {
            // expected
        }

        $this->assertSame(795 + 495, $basket->total());
    }

    public function test_total_is_idempotent(): void
    {
        $basket = $this->makeBasket();
        $basket->add('R01');
        $basket->add('R01');

        $this->assertSame(5437, $basket->total());
        $this->assertSame(5437, $basket->total());
    }

    public function test_total_reflects_items_added_after_a_previous_total(): void
    {
        $basket = $this->makeBasket();
        $basket->add('R01');
        $this->assertSame(3295 + 495, $basket->total());

        $basket->add('R01');
        $this->assertSame(5437, $basket->total());
    }

    public function test_the_order_items_are_added_in_does_not_change_the_total(): void
    {
        $first = $this->makeBasket();
        $second = $this->makeBasket();

        foreach (['B01', 'B01', 'R01', 'R01', 'R01'] as $code) {
            $first->add($code);
        }
        foreach (['R01', 'B01', 'R01', 'B01', 'R01'] as $code) {
            $second->add($code);
        }

        $this->assertSame($first->total(), $second->total());
    }

    public function test_separate_baskets_sharing_a_catalogue_do_not_share_items(): void
    {
        $catalogue = $this->catalogue();
        $delivery = $this->specificationDelivery();

        $first = new Basket($catalogue, $delivery);
        $second = new Basket($catalogue, $delivery);

        $first->add('R01');

        $this->assertSame(3295 + 495, $first->total());
        $this->assertSame(0, $second->total());
    }

    public function test_without_offers_the_total_is_the_plain_sum_plus_delivery(): void
    {
        $basket = new Basket($this->catalogue(), $this->specificationDelivery());
        $basket->add('R01');
        $basket->add('R01');

        $this->assertSame(6590 + 295, $basket->total());
    }

    public function test_delivery_is_charged_on_the_subtotal_after_discounts(): void
    {
        $delivery = new SpyDeliveryChargeRule(0);
        $basket = new Basket($this->catalogue(), $delivery, [new BuyOneGetSecondHalfPrice('R01')]);
        $basket->add('R01');
        $basket->add('R01');

        $basket->total();

        // 6590 before the discount, 4942 after. Delivery must see the discounted amount.
        $this->assertSame([4942], $delivery->receivedSubtotals);
    }

    public function test_a_discount_can_push_the_basket_back_into_a_more_expensive_delivery_tier(): void
    {
        // Without the offer: 6590 -> 295 delivery. With the offer: 4942 -> 495 delivery.
        $withOffer = $this->makeBasket();
        $withoutOffer = new Basket($this->catalogue(), $this->specificationDelivery());

        foreach ([$withOffer, $withoutOffer] as $basket) {
            $basket->add('R01');
            $basket->add('R01');
        }

        $this->assertSame(4942 + 495, $withOffer->total());
        $this->assertSame(6590 + 295, $withoutOffer->total());
    }

    /**
     * @return array<string, array{int, int}>
     */
    public static function deliveryBoundaries(): array
    {
        return [
            'just below 50.00' => [4999, 4999 + 495],
            'exactly 50.00' => [5000, 5000 + 295],
            'just below 90.00' => [8999, 8999 + 295],
            'exactly 90.00' => [9000, 9000],
        ];
    }

    #[DataProvider('deliveryBoundaries')]
    public function test_it_applies_the_delivery_tier_boundaries(int $price, int $expectedTotal): void
    {
        $basket = new Basket(
            new ProductCatalogue([new Product('X01', 'Boundary Widget', $price)]),
            $this->specificationDelivery(),
        );
        $basket->add('X01');

        $this->assertSame($expectedTotal, $basket->total());
    }

    public function test_a_basket_with_only_free_products_still_pays_delivery(): void
    {
        // An empty basket costs 0, but a basket with a free item still has something to ship.
        $basket = new Basket(
            new ProductCatalogue([new Product('F01', 'Free Widget', 0)]),
            $this->specificationDelivery(),
        );
        $basket->add('F01');

        $this->assertSame(495, $basket->total());
    }

    public function test_it_sums_the_discounts_of_every_offer(): void
    {
        $basket = new Basket(
            $this->catalogue(),
            new SpyDeliveryChargeRule(0),
            [new SpyOffer(100), new SpyOffer(250)],
        );
        $basket->add('G01');

        $this->assertSame(2495 - 350, $basket->total());
    }

    public function test_offers_receive_every_product_in_the_order_it_was_added(): void
    {
        $offer = new SpyOffer(0);
        $basket = new Basket($this->catalogue(), new SpyDeliveryChargeRule(0), [$offer]);

        $basket->add('G01');
        $basket->add('R01');
        $basket->add('G01');
        $basket->total();

        $this->assertCount(1, $offer->receivedItems);
        $this->assertSame(
            ['G01', 'R01', 'G01'],
            array_map(fn (Product $product): string => $product->code, $offer->receivedItems[0]),
        );
        $this->assertTrue(array_is_list($offer->receivedItems[0]));
    }

    public function test_offers_receive_the_catalogue_product_instances(): void
    {
        $red = new Product('R01', 'Red Widget', 3295);
        $offer = new SpyOffer(0);
        $basket = new Basket(new ProductCatalogue([$red]), new SpyDeliveryChargeRule(0), [$offer]);

        $basket->add('R01');
        $basket->total();

        $this->assertSame($red, $offer->receivedItems[0][0]);
    }

    public function test_delivery_charge_is_added_on_top_of_the_discounted_subtotal(): void
    {
        $basket = new Basket($this->catalogue(), new SpyDeliveryChargeRule(123), [new SpyOffer(95)]);
        $basket->add('B01');

        $this->assertSame(795 - 95 + 123, $basket->total());
    }

    public function test_a_large_basket_is_totalled_exactly(): void
    {
        $basket = $this->makeBasket();

        for ($i = 0; $i < 1000; $i++) {
            $basket->add('R01');
        }

        // 500 pairs at (3295 + 1647), above 90.00: free delivery.
        $this->assertSame(500 * 4942, $basket->total());
    }

    private function makeBasket(): Basket
    {
        return new Basket(
            $this->catalogue(),
            $this->specificationDelivery(),
            [new BuyOneGetSecondHalfPrice('R01')],
        );
    }

    private function specificationDelivery(): TieredDeliveryCharge
    {
        return new TieredDeliveryCharge([5000 => 495, 9000 => 295]);
    }

    private function catalogue(): ProductCatalogue
    {
        return new ProductCatalogue([
            new Product('R01', 'Red Widget', 3295),
            new Product('G01', 'Green Widget', 2495),
            new Product('B01', 'Blue Widget', 795),
        ]);
    }
}
