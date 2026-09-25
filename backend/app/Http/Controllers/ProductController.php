<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\CalculateBasketRequest;
use App\Services\BasketService;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public BasketService $basketService;

    public function __construct(BasketService $basketService)
    {
        $this->basketService = $basketService;
    }

    public function list(): JsonResponse
    {
        return response()->json(['data' => $this->basketService->products()]);
    }

    public function calculate(CalculateBasketRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->basketService->calculate($request->productCodes())]);
    }
}
