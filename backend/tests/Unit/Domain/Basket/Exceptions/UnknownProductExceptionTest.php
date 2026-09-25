<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Basket\Exceptions;

use App\Domain\Basket\Exceptions\UnknownProductException;
use DomainException;
use PHPUnit\Framework\TestCase;

final class UnknownProductExceptionTest extends TestCase
{
    public function test_it_names_the_unknown_code_in_the_message(): void
    {
        $exception = UnknownProductException::forCode('X99');

        $this->assertSame('Unknown product code [X99].', $exception->getMessage());
    }

    public function test_it_is_a_domain_exception(): void
    {
        $this->assertInstanceOf(DomainException::class, UnknownProductException::forCode('X99'));
    }

    public function test_an_empty_code_is_still_visible_in_the_message(): void
    {
        $this->assertSame('Unknown product code [].', UnknownProductException::forCode('')->getMessage());
    }

}
