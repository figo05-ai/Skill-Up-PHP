<?php

namespace Database\Factories;

use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['pending', 'in-progress', 'completed']),
            'progress_percentage' => fake()->randomFloat(2, 0, 100),
            'deadline' => fake()->dateTimeBetween('now', '+1 month'),
            'assigned_to' => \App\Models\User::factory(),
            'created_by' => \App\Models\User::factory(),
        ];
    }
}
