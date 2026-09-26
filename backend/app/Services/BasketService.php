<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Basket\BasketFactory;
use App\Domain\Basket\ProductCatalogue;
use App\DTOs\ProductData;
use App\DTOs\BasketData;
use App\Repositories\ProductRepository;
use App\Domain\Basket\Exceptions\UnknownProductException;

final readonly class BasketService
{
    public function __construct(
        private ProductRepository $products,
        private BasketFactory $basketFactory,
    ) {}

    /**
     * @return list<ProductData>
     */
    public function products(): array
    {
        $data = [];
        $allProducts = $this->catalogue()->all();

        foreach ($allProducts as $product) {
            $data[] = ProductData::fromProduct($product);
        }
       
        return $data;
    }

     /**
     * @param  list<string>  $productCodes
     *
     * @throws UnknownProductException
     */
    public function calculate(array $productCodes): BasketData
    {
        $basket = $this->basketFactory->make($this->catalogue());

        foreach ($productCodes as $code) {
            $basket->add($code);
        }

        return BasketData::fromSummary($basket->summary());
    }

    /**
     * Data comes from the repository; the catalogue (domain) enforces unique codes.
     */
    private function catalogue(): ProductCatalogue
    {
        return new ProductCatalogue($this->products->all());
    }
}