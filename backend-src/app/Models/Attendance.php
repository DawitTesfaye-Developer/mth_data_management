<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = ['employee_id', 'date', 'clock_in', 'clock_out'];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
    ];

    protected $appends = ['worked_hours'];

    protected function workedHours(): Attribute
    {
        return Attribute::get(function () {
            if (! $this->clock_in || ! $this->clock_out) {
                return null;
            }

            return round($this->clock_in->diffInMinutes($this->clock_out) / 60, 2);
        });
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
