<?php

declare(strict_types=1);

namespace App\Domain\Basket\Exceptions;

use DomainException;

final class UnknownProductException extends DomainException 
{
    public static function forCode(string $code): self
    {
        return new self("Unknown product code [{$code}].");
    }
}