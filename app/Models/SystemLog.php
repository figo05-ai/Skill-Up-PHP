<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemLog extends Model
{
    protected $fillable = [
        'action', 'details', 'performed_by', 'user_id', 'ip_address'
    ];

    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function targetUser()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
