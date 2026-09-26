<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

final class ErrorResponse
{
    /**
     * @param  array<string, array<int, string>>|null  $errors
     */
    public static function make(string $message, ?array $errors = null, int $status = 500): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
