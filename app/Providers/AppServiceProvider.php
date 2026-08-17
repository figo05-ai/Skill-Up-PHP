<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Interfaces\Auth\AuthServiceInterface::class,
            \App\Services\Auth\AuthService::class
        );

        $this->app->bind(
            \App\Interfaces\Client\ClientServiceInterface::class,
            \App\Services\Client\ClientService::class
        );

        $this->app->bind(
            \App\Interfaces\Task\TaskServiceInterface::class,
            \App\Services\Task\TaskService::class
        );

        $this->app->bind(
            \App\Interfaces\Attendance\AttendanceServiceInterface::class,
            \App\Services\Attendance\AttendanceService::class
        );

        $this->app->bind(
            \App\Interfaces\User\UserServiceInterface::class,
            \App\Services\User\UserService::class
        );

        $this->app->bind(
            \App\Interfaces\SystemLog\SystemLogServiceInterface::class,
            \App\Services\SystemLog\SystemLogService::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \App\Models\User::observe(\App\Observers\UserObserver::class);
        \App\Models\Client::observe(\App\Observers\ClientObserver::class);
        \App\Models\Task::observe(\App\Observers\TaskObserver::class);
        \App\Models\Attendance::observe(\App\Observers\AttendanceObserver::class);
    }
}
