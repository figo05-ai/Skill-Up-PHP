<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_users_endpoint(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        
        $response = $this->actingAs($admin)->getJson('/api/users');

        $response->assertStatus(200);
    }

    public function test_staff_cannot_access_users_endpoint(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        
        $response = $this->actingAs($staff)->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_admin_can_create_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        
        $response = $this->actingAs($admin)->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'new@test.com',
            'password' => 'password123',
            'phone' => '1234567890',
            'role' => 'staff',
            'job_title' => 'Developer',
            'nationality' => 'EG',
            'department' => 'IT',
            'personal_email' => 'personal@test.com',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'new@test.com']);
    }
}
