<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Client;
use App\Models\SystemLog;

class SystemLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_logs_action_when_client_is_created(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        
        $this->actingAs($admin)->postJson('/api/clients', [
            'name' => 'Test Client',
            'email' => 'test@client.com',
            'phone' => '123456',
            'address' => 'Cairo',
        ]);

        $this->assertDatabaseHas('system_logs', [
            'performed_by' => $admin->id,
            'action' => 'Created Client'
        ]);
    }

    public function test_only_admin_can_view_system_logs(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        
        $response = $this->actingAs($staff)->getJson('/api/system-logs');

        $response->assertStatus(403);
    }
}
