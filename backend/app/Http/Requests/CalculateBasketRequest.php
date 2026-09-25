<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CalculateBasketRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['present', 'array', 'max:100'],
            'items.*' => ['required', 'string'],
        ];
    }

    /**
     * @return list<string>
     */
    public function productCodes(): array
    {
        return array_values($this->validated('items'));
    }
}
