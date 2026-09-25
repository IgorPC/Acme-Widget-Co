<?php
// THAT'S NOT A UNIT TEST, ONLY A LOCAL TEST FOR DEBUG

declare(strict_types=1);

require '../../../../vendor/autoload.php'; 

use App\Domain\Basket\Basket;
use App\Domain\Basket\Delivery\TieredDeliveryCharge;
use App\Domain\Basket\Offers\BuyOneGetSecondHalfPrice;
use App\Domain\Basket\Product;
use App\Domain\Basket\ProductCatalogue;

$basket = new Basket(
    new ProductCatalogue([
        new Product('R01', 'Red Widget', 3295),
        new Product('G01', 'Green Widget', 2495),
        new Product('B01', 'Blue Widget', 795),
    ]),
    new TieredDeliveryCharge([5000 => 495, 9000 => 295]),
    [new BuyOneGetSecondHalfPrice('R01')],
);

$basket->add('R01');
$basket->add('R01');
print($basket->total()); // 5437