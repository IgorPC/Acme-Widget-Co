<?php
// THAT'S NOT A UNIT TEST, ONLY A LOCAL TEST FOR DEBUG

declare(strict_types=1);

require '../../../../vendor/autoload.php'; 

use App\Domain\Basket\Delivery\TieredDeliveryCharge;

$delivery = new TieredDeliveryCharge([5000 => 495, 9000 => 295], defaultCharge: 0);
print($delivery->chargeFor(4999) . PHP_EOL); // 495
print($delivery->chargeFor(5000) . PHP_EOL); // 295
print($delivery->chargeFor(9000) . PHP_EOL); // 0