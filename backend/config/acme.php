<?php

return [

    /*
    | Product catalogue. Prices are in cents to avoid floating point errors.
    */
    'products' => [
        ['code' => 'R01', 'name' => 'Red Widget', 'price' => 3295],
        ['code' => 'G01', 'name' => 'Green Widget', 'price' => 2495],
        ['code' => 'B01', 'name' => 'Blue Widget', 'price' => 795],
    ],

    /*
    | Delivery charge tiers: "orders below X cents cost Y cents".
    | Orders above the highest tier use the default charge.
    */
    'delivery' => [
        'tiers' => [
            5000 => 495,
            9000 => 295,
        ],
        'default' => 0,
    ],

    /*
    | Active offers.
    */
    'offers' => [
        'buy_one_get_second_half_price' => ['R01'],
    ],

];