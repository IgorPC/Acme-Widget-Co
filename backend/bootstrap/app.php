<?php

use App\Domain\Basket\Exceptions\UnknownProductException;
use App\Support\ErrorResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

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
        $exceptions->dontReport(UnknownProductException::class);

        $exceptions->renderable(function (\Throwable $e) {
            if ($e instanceof NotFoundHttpException) {
                return ErrorResponse::make('Route Not Found', null, 404);
            }

            if ($e instanceof MethodNotAllowedHttpException) {
                return ErrorResponse::make('Method Not Allowed', null, 405);
            }

            if ($e instanceof ValidationException) {
                return ErrorResponse::make('Validation error.', $e->errors(), 422);
            }

            if ($e instanceof UnknownProductException) {
                return ErrorResponse::make($e->getMessage(), null, 422);
            }

            return ErrorResponse::make('Internal Server Error');
        });
    })->create();
