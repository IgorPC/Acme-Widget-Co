<?php

use App\Domain\Basket\Exceptions\UnknownProductException;
use App\Support\ErrorResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
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
                return ErrorResponse::make('Method Not Allowed', null, 405, $e->getHeaders());
            }

            if ($e instanceof ValidationException) {
                return ErrorResponse::make('Validation error.', $e->errors(), 422);
            }

            if ($e instanceof UnknownProductException) {
                return ErrorResponse::make($e->getMessage(), null, 422);
            }

            if ($e instanceof AuthenticationException) {
                return ErrorResponse::make('Unauthenticated', null, 401);
            }

            if ($e instanceof AuthorizationException || $e instanceof AccessDeniedHttpException) {
                return ErrorResponse::make('Forbidden', null, 403);
            }

            if ($e instanceof PostTooLargeException) {
                return ErrorResponse::make('Payload Too Large', null, 413);
            }

            if ($e instanceof ThrottleRequestsException) {
                return ErrorResponse::make('Too Many Requests', null, 429, $e->getHeaders());
            }

            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();

                return ErrorResponse::make(Response::$statusTexts[$status] ?? 'HTTP Error', null, $status, $e->getHeaders());
            }

            return ErrorResponse::make('Internal Server Error');
        });
    })->create();
