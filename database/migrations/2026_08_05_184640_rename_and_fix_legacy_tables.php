<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('employees')) {
            if (Schema::hasTable('users')) {
                Schema::drop('users');
            }
            // 1. Rename employees table
            Schema::rename('employees', 'users');

            // 2. Fix users table columns
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('jobTitle', 'job_title');
                $table->renameColumn('joiningDate', 'joining_date');
                $table->renameColumn('attendancePercentage', 'attendance_percentage');
                $table->renameColumn('personalEmail', 'personal_email');
                $table->renameColumn('identityNumber', 'identity_number');
                $table->renameColumn('monthlyWorkHours', 'monthly_work_hours');
                $table->renameColumn('allowLogin', 'allow_login');
                $table->renameColumn('client', 'client_id');
                $table->renameColumn('createdAt', 'created_at');
                $table->renameColumn('updatedAt', 'updated_at');
            });

            // 3. Fix clients table columns
            if (Schema::hasTable('clients') && Schema::hasColumn('clients', 'personalId')) {
                Schema::table('clients', function (Blueprint $table) {
                    $table->renameColumn('personalId', 'personal_id');
                    $table->renameColumn('commercialRecord', 'commercial_record');
                    $table->renameColumn('laborOfficeNumber', 'labor_office_number');
                    $table->renameColumn('createdAt', 'created_at');
                    $table->renameColumn('updatedAt', 'updated_at');
                });
            }

            // 4. Fix attendances table columns
            if (Schema::hasTable('attendances') && Schema::hasColumn('attendances', 'userRef')) {
                Schema::table('attendances', function (Blueprint $table) {
                    $table->renameColumn('userRef', 'user_id');
                    $table->renameColumn('checkIn', 'check_in');
                    $table->renameColumn('checkOut', 'check_out');
                    $table->renameColumn('workHours', 'work_hours');
                    $table->renameColumn('createdAt', 'created_at');
                    $table->renameColumn('updatedAt', 'updated_at');
                });
            }

            // 5. Fix tasks table columns
            if (Schema::hasTable('tasks') && Schema::hasColumn('tasks', 'assignedTo')) {
                Schema::table('tasks', function (Blueprint $table) {
                    $table->renameColumn('assignedTo', 'assigned_to');
                    $table->renameColumn('progressPercentage', 'progress_percentage');
                    $table->renameColumn('createdBy', 'created_by');
                    $table->renameColumn('createdAt', 'created_at');
                    $table->renameColumn('updatedAt', 'updated_at');
                });
            }

            // 6. Fix system_logs table columns
            if (Schema::hasTable('system_logs') && Schema::hasColumn('system_logs', 'performedBy')) {
                Schema::table('system_logs', function (Blueprint $table) {
                    $table->renameColumn('performedBy', 'performed_by');
                    $table->renameColumn('userId', 'user_id');
                    $table->renameColumn('ipAddress', 'ip_address');
                    $table->renameColumn('createdAt', 'created_at');
                    $table->renameColumn('updatedAt', 'updated_at');
                });
            }
        }

        // Ensure Laravel auth columns exist
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'email_verified_at')) {
                    $table->timestamp('email_verified_at')->nullable()->after('email');
                }
                if (!Schema::hasColumn('users', 'remember_token')) {
                    $table->rememberToken()->after('password');
                }
            });
        }

        // 7. Create missing Laravel standard tables
        if (!Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }

        if (!Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });
        }
    }

    public function down(): void
    {
    }
};
