<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;

Route::get('/products', [ProductController::class, 'list']);
Route::post('/basket', [ProductController::class, 'calculate']);