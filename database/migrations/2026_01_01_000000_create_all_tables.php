<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->string('role')->default('staff');
                $table->string('phone')->nullable();
                $table->string('job_title')->nullable();
                $table->string('nationality')->nullable();
                $table->string('department')->nullable();
                $table->string('personal_email')->nullable()->unique();
                $table->string('identity_number')->nullable();
                $table->date('joining_date')->nullable();
                $table->string('status')->default('active');
                $table->tinyInteger('allow_login')->default(1);
                $table->integer('monthly_work_hours')->nullable();
                $table->integer('attendance_percentage')->nullable();
                $table->unsignedBigInteger('client_id')->nullable();
                $table->rememberToken();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('clients')) {
            Schema::create('clients', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->string('phone')->nullable();
                $table->string('address')->nullable();
                $table->string('personal_id')->nullable();
                $table->string('commercial_record')->nullable();
                $table->string('labor_office_number')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('tasks')) {
            Schema::create('tasks', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('status')->default('pending');
                $table->decimal('progress_percentage', 5, 2)->default(0);
                $table->date('deadline')->nullable();
                $table->unsignedBigInteger('assigned_to')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('attendances')) {
            Schema::create('attendances', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->date('date');
                $table->time('check_in')->nullable();
                $table->time('check_out')->nullable();
                $table->integer('work_hours')->nullable();
                $table->string('status')->default('present');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('system_logs')) {
            Schema::create('system_logs', function (Blueprint $table) {
                $table->id();
                $table->string('action');
                $table->text('details')->nullable();
                $table->unsignedBigInteger('performed_by')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('ip_address')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_logs');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('users');
    }
};
