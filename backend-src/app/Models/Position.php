<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Position extends Model
{
    protected $fillable = ['title', 'department_id'];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
