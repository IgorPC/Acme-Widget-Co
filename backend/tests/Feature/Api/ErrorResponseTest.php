<?php

namespace Tests\Feature\Api;

use App\Support\ErrorResponse;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Route;
use InvalidArgumentException;
use Tests\TestCase;

class ErrorResponseTest extends TestCase
{
    public function test_an_unknown_route_returns_route_not_found(): void
    {
        $this->getJson('/api/does-not-exist')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Route Not Found', 'errors' => null]);
    }

    public function test_a_wrong_method_returns_method_not_allowed(): void
    {
        $this->postJson('/api/products')
            ->assertStatus(405)
            ->assertExactJson(['message' => 'Method Not Allowed', 'errors' => null]);
    }

    public function test_validation_failures_list_the_errors_per_field(): void
    {
        $this->postJson('/api/basket', [])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Validation error.')
            ->assertJsonValidationErrors('items');
    }

    public function test_validation_errors_are_arrays_of_messages(): void
    {
        $response = $this->postJson('/api/basket', ['items' => 'R01'])->assertUnprocessable();

        $this->assertIsArray($response->json('errors.items'));
        $this->assertSame([], array_filter($response->json('errors.items'), fn ($message) => ! is_string($message)));
    }

    public function test_an_unknown_product_returns_its_message_without_field_errors(): void
    {
        $this->postJson('/api/basket', ['items' => ['X99']])
            ->assertUnprocessable()
            ->assertExactJson(['message' => 'Unknown product code [X99].', 'errors' => null]);
    }

    public function test_unexpected_exceptions_return_a_generic_server_error(): void
    {
        Exceptions::fake();
        Route::get('/api/boom', fn () => throw new InvalidArgumentException('secret internal detail'));

        $this->getJson('/api/boom')
            ->assertStatus(500)
            ->assertExactJson(['message' => 'Internal Server Error', 'errors' => null]);

        Exceptions::assertReported(InvalidArgumentException::class);
    }

    public function test_unexpected_exceptions_do_not_leak_their_message(): void
    {
        Exceptions::fake();
        Route::get('/api/boom', fn () => throw new InvalidArgumentException('secret internal detail'));

        $this->getJson('/api/boom')->assertDontSee('secret internal detail');
    }

    public function test_errors_are_json_even_without_a_json_accept_header(): void
    {
        $this->get('/api/does-not-exist')
            ->assertNotFound()
            ->assertHeader('Content-Type', 'application/json');
    }

    public function test_the_helper_defaults_to_a_500_without_errors(): void
    {
        $response = ErrorResponse::make('Oops');

        $this->assertSame(500, $response->getStatusCode());
        $this->assertSame(['message' => 'Oops', 'errors' => null], $response->getData(true));
    }

    public function test_the_helper_accepts_a_status_and_errors(): void
    {
        $response = ErrorResponse::make('Invalid', ['name' => ['Required.']], 422);

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(['message' => 'Invalid', 'errors' => ['name' => ['Required.']]], $response->getData(true));
    }

    public function test_the_application_can_be_booted_repeatedly_in_one_process(): void
    {
        $this->refreshApplication();
        $this->refreshApplication();

        $this->getJson('/api/products')->assertOk();
    }
}
