<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Basket;

use App\Domain\Basket\Exceptions\UnknownProductException;
use App\Domain\Basket\Product;
use App\Domain\Basket\ProductCatalogue;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class ProductCatalogueTest extends TestCase
{
    public function test_it_finds_a_product_by_code(): void
    {
        $red = new Product('R01', 'Red Widget', 3295);
        $catalogue = new ProductCatalogue([
            $red,
            new Product('G01', 'Green Widget', 2495),
        ]);

        $this->assertSame($red, $catalogue->find('R01'));
    }

    public function test_it_throws_for_an_unknown_code(): void
    {
        $catalogue = new ProductCatalogue([new Product('R01', 'Red Widget', 3295)]);

        $this->expectException(UnknownProductException::class);
        $this->expectExceptionMessage('Unknown product code [X99].');

        $catalogue->find('X99');
    }

    public function test_lookup_is_case_sensitive(): void
    {
        $catalogue = new ProductCatalogue([new Product('R01', 'Red Widget', 3295)]);

        $this->expectException(UnknownProductException::class);

        $catalogue->find('r01');
    }

    public function test_lookup_does_not_trim_whitespace(): void
    {
        $catalogue = new ProductCatalogue([new Product('R01', 'Red Widget', 3295)]);

        $this->expectException(UnknownProductException::class);

        $catalogue->find(' R01');
    }

    public function test_an_empty_catalogue_finds_nothing(): void
    {
        $catalogue = new ProductCatalogue([]);

        $this->assertSame([], $catalogue->all());
        $this->assertSame([], $catalogue->codes());

        $this->expectException(UnknownProductException::class);

        $catalogue->find('R01');
    }

    public function test_all_returns_products_as_a_list_in_insertion_order(): void
    {
        $red = new Product('R01', 'Red Widget', 3295);
        $green = new Product('G01', 'Green Widget', 2495);
        $blue = new Product('B01', 'Blue Widget', 795);

        $all = (new ProductCatalogue([$red, $green, $blue]))->all();

        $this->assertSame([$red, $green, $blue], $all);
        $this->assertTrue(array_is_list($all));
    }

    public function test_codes_returns_codes_in_insertion_order(): void
    {
        $catalogue = new ProductCatalogue([
            new Product('R01', 'Red Widget', 3295),
            new Product('G01', 'Green Widget', 2495),
            new Product('B01', 'Blue Widget', 795),
        ]);

        $this->assertSame(['R01', 'G01', 'B01'], $catalogue->codes());
    }

    public function test_a_duplicated_code_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Duplicate product code [R01].');

        new ProductCatalogue([
            new Product('R01', 'Red Widget', 3295),
            new Product('R01', 'Red Widget (new price)', 3000),
        ]);
    }

    public function test_changing_the_source_array_after_construction_does_not_affect_it(): void
    {
        $products = [new Product('R01', 'Red Widget', 3295)];
        $catalogue = new ProductCatalogue($products);

        $products[] = new Product('G01', 'Green Widget', 2495);

        $this->assertSame(['R01'], $catalogue->codes());
    }
}
