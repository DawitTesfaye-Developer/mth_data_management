<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    protected $fillable = ['name', 'days_per_year', 'paid'];

    protected $casts = ['paid' => 'boolean'];
}
