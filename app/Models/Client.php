<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'name', 'email', 'phone', 'personal_id', 
        'commercial_record', 'labor_office_number', 'address'
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
