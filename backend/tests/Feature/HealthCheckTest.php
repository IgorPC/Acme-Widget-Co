<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_the_application_boots(): void
    {
        $this->get('/up')->assertOk();
    }
}
