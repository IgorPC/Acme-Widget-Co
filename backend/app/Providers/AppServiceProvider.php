<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Domain\Basket\BasketFactory;
use App\Domain\Basket\Delivery\DeliveryChargeRule;
use App\Domain\Basket\Delivery\TieredDeliveryCharge;
use App\Domain\Basket\Offers\BuyOneGetSecondHalfPrice;
use App\Repositories\Config\ConfigProductRepository;
use App\Repositories\ProductRepository;
use Illuminate\Contracts\Foundation\Application;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ProductRepository::class, ConfigProductRepository::class);

        $this->app->singleton(DeliveryChargeRule::class, fn (): DeliveryChargeRule => new TieredDeliveryCharge(
            config('acme.delivery.tiers'),
            config('acme.delivery.default'),
        ));

        $this->app->singleton(BasketFactory::class, fn (Application $app): BasketFactory => new BasketFactory(
            $app->make(DeliveryChargeRule::class),
            array_map(
                fn (string $code): BuyOneGetSecondHalfPrice => new BuyOneGetSecondHalfPrice($code),
                config('acme.offers.buy_one_get_second_half_price'),
            ),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
