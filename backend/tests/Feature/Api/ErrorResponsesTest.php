<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

final class ErrorResponsesTest extends TestCase
{
    public function test_an_unauthenticated_request_returns_401(): void
    {
        Route::get('/api/_test/unauthenticated', fn () => throw new AuthenticationException());

        $this->getJson('/api/_test/unauthenticated')
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Unauthenticated', 'errors' => null]);
    }

    public function test_an_unauthenticated_request_returns_json_without_a_json_accept_header(): void
    {
        Route::get('/api/_test/unauthenticated', fn () => throw new AuthenticationException());

        $this->get('/api/_test/unauthenticated')
            ->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/json')
            ->assertExactJson(['message' => 'Unauthenticated', 'errors' => null]);
    }

    public function test_a_failed_authorization_returns_403(): void
    {
        Route::get('/api/_test/forbidden', fn () => throw new AuthorizationException('Secret reason.'));

        $this->getJson('/api/_test/forbidden')
            ->assertForbidden()
            ->assertExactJson(['message' => 'Forbidden', 'errors' => null]);
    }

    public function test_an_access_denied_http_exception_returns_403(): void
    {
        Route::get('/api/_test/access-denied', fn () => throw new AccessDeniedHttpException());

        $this->getJson('/api/_test/access-denied')
            ->assertForbidden()
            ->assertExactJson(['message' => 'Forbidden', 'errors' => null]);
    }

    public function test_aborting_with_403_returns_403(): void
    {
        Route::get('/api/_test/abort-forbidden', fn () => abort(403));

        $this->getJson('/api/_test/abort-forbidden')
            ->assertForbidden()
            ->assertExactJson(['message' => 'Forbidden', 'errors' => null]);
    }

    public function test_a_payload_that_is_too_large_returns_413(): void
    {
        Route::post('/api/_test/too-large', fn () => throw new PostTooLargeException());

        $this->postJson('/api/_test/too-large')
            ->assertStatus(413)
            ->assertExactJson(['message' => 'Payload Too Large', 'errors' => null]);
    }

    public function test_a_throttled_request_returns_429_with_retry_after(): void
    {
        Route::get('/api/_test/throttled', fn () => throw new ThrottleRequestsException(headers: ['Retry-After' => '30']));

        $this->getJson('/api/_test/throttled')
            ->assertTooManyRequests()
            ->assertHeader('Retry-After', '30')
            ->assertExactJson(['message' => 'Too Many Requests', 'errors' => null]);
    }

    public function test_the_throttle_middleware_returns_429_once_the_limit_is_reached(): void
    {
        Route::middleware('throttle:2,1')->get('/api/_test/limited', fn () => ['ok' => true]);

        $this->getJson('/api/_test/limited')->assertOk();
        $this->getJson('/api/_test/limited')->assertOk();

        $this->getJson('/api/_test/limited')
            ->assertTooManyRequests()
            ->assertHeader('Retry-After')
            ->assertJsonPath('message', 'Too Many Requests')
            ->assertJsonPath('errors', null);
    }

    public function test_other_http_exceptions_keep_their_status_code(): void
    {
        Route::get('/api/_test/unavailable', fn () => abort(503));

        $this->getJson('/api/_test/unavailable')
            ->assertServiceUnavailable()
            ->assertExactJson(['message' => 'Service Unavailable', 'errors' => null]);
    }

    public function test_other_http_exceptions_keep_their_headers(): void
    {
        Route::get('/api/_test/teapot', fn () => throw new HttpException(418, 'Short and stout.', null, ['X-Teapot' => 'yes']));

        $this->getJson('/api/_test/teapot')
            ->assertStatus(418)
            ->assertHeader('X-Teapot', 'yes')
            ->assertExactJson(['message' => "I'm a teapot", 'errors' => null]);
    }

    public function test_an_unknown_http_status_uses_a_generic_message(): void
    {
        Route::get('/api/_test/unknown-status', fn () => abort(499));

        $this->getJson('/api/_test/unknown-status')
            ->assertStatus(499)
            ->assertExactJson(['message' => 'HTTP Error', 'errors' => null]);
    }

    public function test_a_method_not_allowed_response_lists_the_allowed_methods(): void
    {
        $this->getJson('/api/basket')
            ->assertMethodNotAllowed()
            ->assertHeader('Allow', 'POST')
            ->assertExactJson(['message' => 'Method Not Allowed', 'errors' => null]);
    }

    public function test_an_unexpected_exception_returns_500_without_leaking_details(): void
    {
        Exceptions::fake();

        Route::get('/api/_test/crash', fn () => throw new RuntimeException('Database password is hunter2.'));

        $this->getJson('/api/_test/crash')
            ->assertInternalServerError()
            ->assertExactJson(['message' => 'Internal Server Error', 'errors' => null]);

        Exceptions::assertReported(RuntimeException::class);
    }
}
