<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Task;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_see_all_tasks(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Task::factory()->count(3)->create();
        
        $response = $this->actingAs($admin)->getJson('/api/tasks');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data.data'));
    }

    public function test_staff_sees_only_assigned_tasks(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        
        // Task assigned to staff
        Task::factory()->create(['assigned_to' => $staff->id]);
        
        // Task assigned to someone else
        Task::factory()->create();
        
        $response = $this->actingAs($staff)->getJson('/api/tasks');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.data'));
    }
}
