<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

final class ErrorResponse
{
    /**
     * @param  array<string, array<int, string>>|null  $errors
     * @param  array<string, string>  $headers
     */
    public static function make(string $message, ?array $errors = null, int $status = 500, array $headers = []): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'errors' => $errors,
        ], $status, $headers);
    }
}
