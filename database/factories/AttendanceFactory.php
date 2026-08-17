<?php

namespace Database\Factories;

use App\Models\Attendance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Attendance>
 */
class AttendanceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'date' => fake()->date(),
            'check_in_time' => fake()->time(),
            'check_out_time' => fake()->time(),
            'status' => fake()->randomElement(['present', 'absent', 'late', 'excused']),
        ];
    }
}
