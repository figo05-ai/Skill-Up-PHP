<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Client;

class ClientTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_access_clients(): void
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)->getJson('/api/clients');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_client(): void
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)->postJson('/api/clients', [
            'name' => 'Acme Corp',
            'email' => 'contact@acme.com',
            'phone' => '1234567890',
            'address' => '123 Main St',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('clients', ['email' => 'contact@acme.com']);
    }
}
