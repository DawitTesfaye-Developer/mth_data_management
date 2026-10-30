<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    /** Fields only HR (or the employee themself) may see. */
    public const SENSITIVE = [
        'salary', 'date_of_birth', 'address',
        'emergency_contact_name', 'emergency_contact_phone',
    ];

    protected $fillable = [
        'user_id', 'employee_number', 'first_name', 'last_name', 'email', 'phone',
        'gender', 'date_of_birth', 'address', 'hire_date', 'department_id', 'position_id',
        'employment_type', 'status', 'salary', 'emergency_contact_name', 'emergency_contact_phone',
    ];

    protected $casts = [
        'date_of_birth' => 'date:Y-m-d',
        'hire_date' => 'date:Y-m-d',
        'salary' => 'decimal:2',
    ];

    protected $appends = ['full_name'];

    protected static function booted(): void
    {
        static::creating(function (Employee $employee) {
            if (! $employee->employee_number) {
                $next = (int) (static::withTrashed()->max('id') ?? 0) + 1;
                $employee->employee_number = 'EMP-'.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    protected function fullName(): Attribute
    {
        return Attribute::get(fn () => trim($this->first_name.' '.$this->last_name));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}
