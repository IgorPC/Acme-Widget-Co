<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Domain\Basket\Exceptions\UnknownProductException;
use Illuminate\Support\Facades\Exceptions;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

final class BasketEndpointTest extends TestCase
{
    public static function exampleBaskets(): array
    {
        return [
            'B01, G01' => [['B01', 'G01'], 3785],
            'R01, R01' => [['R01', 'R01'], 5437],
            'R01, G01' => [['R01', 'G01'], 6085],
            'B01, B01, R01, R01, R01' => [['B01', 'B01', 'R01', 'R01', 'R01'], 9827],
        ];
    }

    #[DataProvider('exampleBaskets')]
    public function test_it_calculates_the_total(array $items, int $expectedTotal): void
    {
        $this->postJson('/api/basket', ['items' => $items])
            ->assertOk()
            ->assertJsonPath('data.total', $expectedTotal);
    }

    public static function additionalBaskets(): array
    {
        return [
            'single B01' => [['B01'], 1290],
            'single R01' => [['R01'], 3790],
            'three R01' => [['R01', 'R01', 'R01'], 8532],
            'four R01' => [['R01', 'R01', 'R01', 'R01'], 9884],
            'one of each' => [['R01', 'G01', 'B01'], 6880],
            'four G01' => [['G01', 'G01', 'G01', 'G01'], 9980],
        ];
    }

    #[DataProvider('additionalBaskets')]
    public function test_it_calculates_other_totals(array $items, int $expectedTotal): void
    {
        $this->postJson('/api/basket', ['items' => $items])
            ->assertOk()
            ->assertJsonPath('data.total', $expectedTotal);
    }

    public function test_it_returns_the_items_and_the_total(): void
    {
        $this->postJson('/api/basket', ['items' => ['R01', 'R01']])
            ->assertOk()
            ->assertHeader('Content-Type', 'application/json')
            ->assertExactJson([
                'data' => ['items' => ['R01', 'R01'], 'subtotal' => 6590, 'discount' => 1648, 'delivery' => 495, 'total' => 5437],
            ]);
    }

    public function test_it_echoes_the_items_in_the_order_they_were_sent(): void
    {
        $this->postJson('/api/basket', ['items' => ['B01', 'R01', 'B01', 'G01']])
            ->assertOk()
            ->assertJsonPath('data.items', ['B01', 'R01', 'B01', 'G01']);
    }

    public function test_an_empty_basket_is_valid(): void
    {
        $this->postJson('/api/basket', ['items' => []])
            ->assertOk()
            ->assertJsonPath('data.total', 0);
    }

    public function test_an_empty_basket_returns_no_items(): void
    {
        $this->postJson('/api/basket', ['items' => []])
            ->assertOk()
            ->assertExactJson(['data' => ['items' => [], 'subtotal' => 0, 'discount' => 0, 'delivery' => 0, 'total' => 0]]);
    }

    public function test_unknown_products_are_rejected(): void
    {
        $this->postJson('/api/basket', ['items' => ['X99']])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Unknown product code [X99].')
            ->assertJsonPath('errors', null);
    }

    public function test_the_unknown_product_error_has_a_message_and_no_field_errors(): void
    {
        $this->postJson('/api/basket', ['items' => ['X99']])
            ->assertUnprocessable()
            ->assertExactJson([
                'message' => 'Unknown product code [X99].',
                'errors' => null,
            ]);
    }

    public function test_a_single_unknown_product_rejects_the_whole_basket(): void
    {
        $this->postJson('/api/basket', ['items' => ['R01', 'G01', 'X99']])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Unknown product code [X99].')
            ->assertJsonMissingPath('data');
    }

    public function test_only_the_first_unknown_product_is_named_in_the_message(): void
    {
        $this->postJson('/api/basket', ['items' => ['X01', 'X02']])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Unknown product code [X01].')
            ->assertJsonPath('errors', null);
    }

    public function test_product_codes_are_case_sensitive(): void
    {
        $this->postJson('/api/basket', ['items' => ['r01']])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Unknown product code [r01].');
    }

    public function test_surrounding_whitespace_in_product_codes_is_trimmed(): void
    {
        $this->postJson('/api/basket', ['items' => [' R01 ', "B01\t"]])
            ->assertOk()
            ->assertJsonPath('data.items', ['R01', 'B01'])
            ->assertJsonPath('data.total', 3295 + 795 + 495);
    }

    public function test_unknown_products_are_not_reported_as_errors(): void
    {
        Exceptions::fake();

        $this->postJson('/api/basket', ['items' => ['X99']])
            ->assertUnprocessable();

        Exceptions::assertNotReported(UnknownProductException::class);
    }

    public function test_items_are_required(): void
    {
        $this->postJson('/api/basket', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items');
    }

    public static function invalidItemsFields(): array
    {
        return [
            'null' => [null],
            'empty string' => [''],
            'string' => ['R01'],
            'integer' => [1],
            'boolean' => [true],
        ];
    }

    #[DataProvider('invalidItemsFields')]
    public function test_items_must_be_an_array(mixed $items): void
    {
        $this->postJson('/api/basket', ['items' => $items])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items');
    }

    public static function invalidItemValues(): array
    {
        return [
            'null' => [null],
            'empty string' => [''],
            'blank string' => ['   '],
            'integer' => [101],
            'float' => [1.5],
            'boolean' => [false],
            'nested array' => [['R01']],
        ];
    }

    #[DataProvider('invalidItemValues')]
    public function test_every_item_must_be_a_non_empty_string(mixed $value): void
    {
        $this->postJson('/api/basket', ['items' => [$value]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items.0');
    }

    public function test_the_validation_error_points_to_the_invalid_item(): void
    {
        $this->postJson('/api/basket', ['items' => ['R01', 'G01', 5]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items.2')
            ->assertJsonMissingValidationErrors(['items.0', 'items.1']);
    }

    public function test_a_basket_with_one_hundred_items_is_accepted(): void
    {
        $this->postJson('/api/basket', ['items' => array_fill(0, 100, 'R01')])
            ->assertOk()
            ->assertJsonCount(100, 'data.items')
            ->assertJsonPath('data.total', 50 * (3295 + 1647));
    }

    public function test_a_basket_with_more_than_one_hundred_items_is_rejected(): void
    {
        $this->postJson('/api/basket', ['items' => array_fill(0, 101, 'R01')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items');
    }

    public function test_an_items_object_is_treated_as_a_list(): void
    {
        $this->postJson('/api/basket', ['items' => ['first' => 'R01', 'second' => 'R01']])
            ->assertOk()
            ->assertJsonPath('data.items', ['R01', 'R01'])
            ->assertJsonPath('data.total', 5437);
    }

    public function test_unexpected_fields_are_ignored(): void
    {
        $this->postJson('/api/basket', ['items' => ['B01'], 'total' => 1, 'discount' => 9999])
            ->assertOk()
            ->assertExactJson(['data' => ['items' => ['B01'], 'subtotal' => 795, 'discount' => 0, 'delivery' => 495, 'total' => 1290]]);
    }

    public function test_it_accepts_a_form_encoded_request(): void
    {
        $this->post('/api/basket', ['items' => ['R01', 'R01']])
            ->assertOk()
            ->assertJsonPath('data.total', 5437);
    }

    public function test_validation_errors_are_json_even_without_a_json_accept_header(): void
    {
        $this->post('/api/basket', [])
            ->assertUnprocessable()
            ->assertHeader('Content-Type', 'application/json')
            ->assertJsonValidationErrors('items');
    }

    public function test_each_request_starts_with_an_empty_basket(): void
    {
        $this->postJson('/api/basket', ['items' => ['R01']])
            ->assertJsonPath('data.total', 3790);

        $this->postJson('/api/basket', ['items' => ['R01']])
            ->assertJsonPath('data.total', 3790);
    }

    public function test_it_does_not_accept_get(): void
    {
        $this->getJson('/api/basket')
            ->assertStatus(405)
            ->assertJsonStructure(['message']);
    }

    public function test_it_does_not_accept_put(): void
    {
        $this->putJson('/api/basket', ['items' => ['R01']])
            ->assertStatus(405);
    }

    public static function breakdowns(): array
    {
        return [
            'B01, G01' => [['B01', 'G01'], 3290, 0, 495, 3785],
            'R01, R01' => [['R01', 'R01'], 6590, 1648, 495, 5437],
            'R01, G01' => [['R01', 'G01'], 5790, 0, 295, 6085],
            'B01, B01, R01, R01, R01' => [['B01', 'B01', 'R01', 'R01', 'R01'], 11475, 1648, 0, 9827],
            'three R01' => [['R01', 'R01', 'R01'], 9885, 1648, 295, 8532],
            'four R01' => [['R01', 'R01', 'R01', 'R01'], 13180, 3296, 0, 9884],
            'four G01' => [['G01', 'G01', 'G01', 'G01'], 9980, 0, 0, 9980],
            'discount removes free delivery' => [['R01', 'R01', 'G01'], 9085, 1648, 295, 7732],
        ];
    }

    #[DataProvider('breakdowns')]
    public function test_it_returns_the_full_breakdown(
        array $items,
        int $subtotal,
        int $discount,
        int $delivery,
        int $total,
    ): void {
        $this->postJson('/api/basket', ['items' => $items])
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'items' => $items,
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'delivery' => $delivery,
                    'total' => $total,
                ],
            ]);
    }

    public function test_the_breakdown_has_every_field(): void
    {
        $this->postJson('/api/basket', ['items' => ['R01']])
            ->assertOk()
            ->assertJsonStructure(['data' => ['items', 'subtotal', 'discount', 'delivery', 'total']]);
    }

    public function test_the_breakdown_amounts_add_up_to_the_total(): void
    {
        $data = $this->postJson('/api/basket', ['items' => ['B01', 'R01', 'G01', 'R01', 'R01']])
            ->assertOk()
            ->json('data');

        $this->assertSame($data['subtotal'] - $data['discount'] + $data['delivery'], $data['total']);
    }

    public function test_a_discount_can_take_the_basket_out_of_free_delivery(): void
    {
        $this->postJson('/api/basket', ['items' => ['R01', 'R01', 'G01']])
            ->assertOk()
            ->assertJsonPath('data.subtotal', 9085)
            ->assertJsonPath('data.discount', 1648)
            ->assertJsonPath('data.delivery', 295)
            ->assertJsonPath('data.total', 7732);
    }

    public function test_the_breakdown_of_the_largest_allowed_basket(): void
    {
        $this->postJson('/api/basket', ['items' => array_fill(0, 100, 'R01')])
            ->assertOk()
            ->assertJsonPath('data.subtotal', 100 * 3295)
            ->assertJsonPath('data.discount', 50 * 1648)
            ->assertJsonPath('data.delivery', 0)
            ->assertJsonPath('data.total', 50 * (3295 + 1647));
    }

    public function test_the_breakdown_uses_the_trimmed_product_codes(): void
    {
        $this->postJson('/api/basket', ['items' => [' R01', 'R01 ']])
            ->assertOk()
            ->assertExactJson([
                'data' => ['items' => ['R01', 'R01'], 'subtotal' => 6590, 'discount' => 1648, 'delivery' => 495, 'total' => 5437],
            ]);
    }

    public function test_the_breakdown_has_no_discount_without_configured_offers(): void
    {
        config(['acme.offers.buy_one_get_second_half_price' => []]);

        $this->postJson('/api/basket', ['items' => ['R01', 'R01']])
            ->assertOk()
            ->assertExactJson([
                'data' => ['items' => ['R01', 'R01'], 'subtotal' => 6590, 'discount' => 0, 'delivery' => 295, 'total' => 6885],
            ]);
    }

    public function test_the_breakdown_uses_the_configured_delivery_charge(): void
    {
        config([
            'acme.delivery.tiers' => [],
            'acme.delivery.default' => 100,
        ]);

        $this->postJson('/api/basket', ['items' => ['R01', 'R01']])
            ->assertOk()
            ->assertJsonPath('data.discount', 1648)
            ->assertJsonPath('data.delivery', 100)
            ->assertJsonPath('data.total', 6590 - 1648 + 100);
    }

    public function test_the_breakdown_of_free_products_is_only_delivery(): void
    {
        config(['acme.products' => [
            ['code' => 'F01', 'name' => 'Free Widget', 'price' => 0],
        ]]);

        $this->postJson('/api/basket', ['items' => ['F01']])
            ->assertOk()
            ->assertExactJson([
                'data' => ['items' => ['F01'], 'subtotal' => 0, 'discount' => 0, 'delivery' => 495, 'total' => 495],
            ]);
    }

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
    public function test_it_applies_the_configured_delivery_tiers_at_their_boundaries(int $price, int $expectedTotal): void
    {
        config(['acme.products' => [
            ['code' => 'X01', 'name' => 'Boundary Widget', 'price' => $price],
        ]]);

        $this->postJson('/api/basket', ['items' => ['X01']])
            ->assertOk()
            ->assertJsonPath('data.total', $expectedTotal);
    }

    public function test_it_uses_the_configured_offers(): void
    {
        config(['acme.offers.buy_one_get_second_half_price' => []]);

        $this->postJson('/api/basket', ['items' => ['R01', 'R01']])
            ->assertOk()
            ->assertJsonPath('data.total', 6590 + 295);
    }

    public function test_it_supports_more_than_one_configured_offer(): void
    {
        config(['acme.offers.buy_one_get_second_half_price' => ['R01', 'G01']]);

        $this->postJson('/api/basket', ['items' => ['G01', 'G01']])
            ->assertOk()
            ->assertJsonPath('data.total', 2495 + 1247 + 495);
    }

    public function test_it_uses_the_configured_delivery_charges(): void
    {
        config([
            'acme.delivery.tiers' => [],
            'acme.delivery.default' => 100,
        ]);

        $this->postJson('/api/basket', ['items' => ['B01']])
            ->assertOk()
            ->assertJsonPath('data.total', 795 + 100);
    }

    public function test_it_uses_the_configured_catalogue(): void
    {
        config(['acme.products' => [
            ['code' => 'Y01', 'name' => 'Yellow Widget', 'price' => 1000],
        ]]);

        $this->postJson('/api/basket', ['items' => ['Y01']])
            ->assertOk()
            ->assertJsonPath('data.total', 1000 + 495);

        $this->postJson('/api/basket', ['items' => ['R01']])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Unknown product code [R01].');
    }
}
