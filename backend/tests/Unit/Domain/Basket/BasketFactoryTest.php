<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Basket;

use App\Domain\Basket\Basket;
use App\Domain\Basket\BasketFactory;
use App\Domain\Basket\Delivery\TieredDeliveryCharge;
use App\Domain\Basket\Exceptions\UnknownProductException;
use App\Domain\Basket\Offers\BuyOneGetSecondHalfPrice;
use App\Domain\Basket\Product;
use App\Domain\Basket\ProductCatalogue;
use PHPUnit\Framework\TestCase;
use Tests\Unit\Domain\Basket\Doubles\SpyDeliveryChargeRule;
use Tests\Unit\Domain\Basket\Doubles\SpyOffer;

final class BasketFactoryTest extends TestCase
{
    public function test_it_makes_an_empty_basket(): void
    {
        $basket = $this->makeFactory()->make($this->catalogue());

        $this->assertInstanceOf(Basket::class, $basket);
        $this->assertSame(0, $basket->total());
    }

    public function test_the_basket_uses_the_given_catalogue(): void
    {
        $basket = $this->makeFactory()->make(new ProductCatalogue([new Product('Y01', 'Yellow Widget', 1000)]));
        $basket->add('Y01');

        $this->assertSame(1495, $basket->total());

        $this->expectException(UnknownProductException::class);

        $basket->add('R01');
    }

    public function test_the_basket_uses_the_factory_rules(): void
    {
        $basket = $this->makeFactory()->make($this->catalogue());
        $basket->add('R01');
        $basket->add('R01');

        $this->assertSame(5437, $basket->total());
    }

    public function test_the_basket_uses_the_factory_delivery_rule_and_offers(): void
    {
        $delivery = new SpyDeliveryChargeRule(7);
        $offer = new SpyOffer(5);

        $basket = (new BasketFactory($delivery, [$offer]))->make($this->catalogue());
        $basket->add('B01');

        $this->assertSame(795 - 5 + 7, $basket->total());
        $this->assertSame([790], $delivery->receivedSubtotals);
        $this->assertCount(1, $offer->receivedItems);
    }

    public function test_without_offers_there_is_no_discount(): void
    {
        $basket = (new BasketFactory(new TieredDeliveryCharge([5000 => 495, 9000 => 295])))->make($this->catalogue());
        $basket->add('R01');
        $basket->add('R01');

        $this->assertSame(0, $basket->summary()->discount);
        $this->assertSame(6885, $basket->total());
    }

    public function test_every_call_makes_a_new_independent_basket(): void
    {
        $factory = $this->makeFactory();
        $catalogue = $this->catalogue();

        $first = $factory->make($catalogue);
        $second = $factory->make($catalogue);
        $first->add('R01');

        $this->assertNotSame($first, $second);
        $this->assertSame(3790, $first->total());
        $this->assertSame(0, $second->total());
    }

    private function makeFactory(): BasketFactory
    {
        return new BasketFactory(
            new TieredDeliveryCharge([5000 => 495, 9000 => 295]),
            [new BuyOneGetSecondHalfPrice('R01')],
        );
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
