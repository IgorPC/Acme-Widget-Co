<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\Exceptions;
use InvalidArgumentException;
use Tests\TestCase;

final class ProductsEndpointTest extends TestCase
{
    public function test_it_lists_the_catalogue(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0', ['code' => 'R01', 'name' => 'Red Widget', 'price' => 3295]);
    }

    public function test_it_returns_the_whole_catalogue_in_configuration_order(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    ['code' => 'R01', 'name' => 'Red Widget', 'price' => 3295],
                    ['code' => 'G01', 'name' => 'Green Widget', 'price' => 2495],
                    ['code' => 'B01', 'name' => 'Blue Widget', 'price' => 795],
                ],
            ]);
    }

    public function test_every_product_has_code_name_and_price(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonStructure(['data' => ['*' => ['code', 'name', 'price']]]);
    }

    public function test_prices_are_integer_cents(): void
    {
        $this->getJson('/api/products')
            ->assertJsonPath('data.0.price', 3295)
            ->assertJsonPath('data.1.price', 2495)
            ->assertJsonPath('data.2.price', 795);
    }

    public function test_it_responds_with_json(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    }

    public function test_it_responds_with_json_even_without_a_json_accept_header(): void
    {
        $this->get('/api/products')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/json')
            ->assertJsonCount(3, 'data');
    }

    public function test_query_parameters_are_ignored(): void
    {
        $this->getJson('/api/products?code=R01&limit=1')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_it_reflects_the_configured_catalogue(): void
    {
        config(['acme.products' => [
            ['code' => 'Y01', 'name' => 'Yellow Widget', 'price' => 1000],
        ]]);

        $this->getJson('/api/products')
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    ['code' => 'Y01', 'name' => 'Yellow Widget', 'price' => 1000],
                ],
            ]);
    }

    public function test_an_empty_catalogue_returns_an_empty_list(): void
    {
        config(['acme.products' => []]);

        $this->getJson('/api/products')
            ->assertOk()
            ->assertExactJson(['data' => []]);
    }

    public function test_a_catalogue_with_duplicated_codes_is_a_server_error(): void
    {
        Exceptions::fake();

        config(['acme.products' => [
            ['code' => 'R01', 'name' => 'Red Widget', 'price' => 3295],
            ['code' => 'R01', 'name' => 'Another Red Widget', 'price' => 3000],
        ]]);

        $this->getJson('/api/products')
            ->assertStatus(500)
            ->assertJsonStructure(['message']);

        Exceptions::assertReported(InvalidArgumentException::class);
    }

    public function test_it_does_not_accept_post(): void
    {
        $this->postJson('/api/products', ['code' => 'X01'])
            ->assertStatus(405)
            ->assertJsonStructure(['message']);
    }

    public function test_it_does_not_accept_delete(): void
    {
        $this->deleteJson('/api/products')
            ->assertStatus(405);
    }

    public function test_an_unknown_api_route_returns_a_json_not_found(): void
    {
        $this->get('/api/does-not-exist')
            ->assertNotFound()
            ->assertHeader('Content-Type', 'application/json')
            ->assertJsonStructure(['message']);
    }
}
