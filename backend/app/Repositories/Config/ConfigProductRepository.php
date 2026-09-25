<?php

declare(strict_types=1);

namespace App\Repositories\Config;

use App\Domain\Basket\Product;
use App\Repositories\ProductRepository;
use Illuminate\Contracts\Config\Repository as Config;

/**
 * Reads the product catalogue from config/acme.php.
 */
final readonly class ConfigProductRepository implements ProductRepository
{
    public function __construct(private Config $config) {}

    public function all(): array
    {
        /** @var list<array{code: string, name: string, price: int}> $rows */
        $rows = $this->config->get('acme.products', []);

        return array_map(
            fn (array $row): Product => new Product($row['code'], $row['name'], $row['price']),
            $rows,
        );
    }
}