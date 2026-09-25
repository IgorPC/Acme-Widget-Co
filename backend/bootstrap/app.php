<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Domain\Basket\Exceptions\UnknownProductException;
use Illuminate\Http\JsonResponse;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API-only app: always render errors as JSON.
        $exceptions->shouldRenderJsonWhen(fn () => true);

        // Unknown product codes are a client error, not a bug: don't log them.
        $exceptions->dontReport(UnknownProductException::class);

        // Domain exception -> 422, in the same shape as Laravel validation errors.
        $exceptions->render(fn (UnknownProductException $e): JsonResponse => response()->json([
            'message' => $e->getMessage(),
            'errors' => ['items' => [$e->getMessage()]],
        ], 422));
    })->create();
