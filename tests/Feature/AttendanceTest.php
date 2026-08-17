<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Attendance;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_record_attendance(): void
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)->postJson('/api/attendances', [
            'user_id' => $user->id,
            'date' => date('Y-m-d'),
            'check_in' => date('Y-m-d') . ' 09:00:00',
            'status' => 'present',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('attendances', ['user_id' => $user->id, 'status' => 'present']);
    }
}
