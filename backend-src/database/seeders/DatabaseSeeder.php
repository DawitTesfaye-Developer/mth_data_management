<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---- reference data -------------------------------------------------
        $structure = [
            'Engineering' => ['Software Engineer', 'Senior Software Engineer', 'QA Engineer', 'Engineering Manager'],
            'Human Resources' => ['HR Officer', 'HR Manager', 'Recruiter'],
            'Finance' => ['Accountant', 'Payroll Specialist', 'Finance Manager'],
            'Sales & Marketing' => ['Sales Executive', 'Marketing Officer', 'Account Manager'],
            'Operations' => ['Operations Coordinator', 'Logistics Officer', 'Operations Manager'],
        ];

        $departments = [];
        $positions = [];
        foreach ($structure as $dept => $titles) {
            $departments[$dept] = Department::create([
                'name' => $dept,
                'description' => $dept.' team',
            ]);
            foreach ($titles as $title) {
                $positions[$dept][] = Position::create(['title' => $title, 'department_id' => $departments[$dept]->id]);
            }
        }

        $leaveTypes = collect([
            ['Annual leave', 16, true],
            ['Sick leave', 30, true],
            ['Maternity leave', 90, true],
            ['Paternity leave', 5, true],
            ['Unpaid leave', 0, false],
        ])->map(fn ($t) => LeaveType::create(['name' => $t[0], 'days_per_year' => $t[1], 'paid' => $t[2]]));

        // ---- accounts -------------------------------------------------------
        User::create(['name' => 'System Admin', 'email' => 'admin@example.com', 'password' => 'password', 'role' => 'admin']);

        $people = [
            ['Selam', 'Tesfaye', 'female', 'Human Resources', 1, 'hr@example.com', 'hr'],
            ['Abel', 'Bekele', 'male', 'Engineering', 1, 'employee@example.com', 'employee'],
            ['Hana', 'Girma', 'female', 'Engineering', 0, null, null],
            ['Dawit', 'Alemu', 'male', 'Engineering', 2, null, null],
            ['Meron', 'Haile', 'female', 'Engineering', 3, null, null],
            ['Yonas', 'Kebede', 'male', 'Finance', 0, null, null],
            ['Tigist', 'Assefa', 'female', 'Finance', 1, null, null],
            ['Biruk', 'Mulugeta', 'male', 'Finance', 2, null, null],
            ['Rahel', 'Worku', 'female', 'Sales & Marketing', 0, null, null],
            ['Samuel', 'Desta', 'male', 'Sales & Marketing', 1, null, null],
            ['Liya', 'Negash', 'female', 'Sales & Marketing', 2, null, null],
            ['Kaleb', 'Tadesse', 'male', 'Operations', 0, null, null],
            ['Eden', 'Abebe', 'female', 'Operations', 1, null, null],
            ['Nahom', 'Fikre', 'male', 'Operations', 2, null, null],
            ['Betty', 'Solomon', 'female', 'Human Resources', 2, null, null],
        ];

        $employees = [];
        foreach ($people as $i => [$first, $last, $gender, $dept, $posIndex, $email, $role]) {
            $userId = null;
            if ($email) {
                $userId = User::create([
                    'name' => "$first $last",
                    'email' => $email,
                    'password' => 'password',
                    'role' => $role,
                ])->id;
            }

            $employees[] = Employee::create([
                'user_id' => $userId,
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email ?? strtolower($first).'.'.strtolower($last).'@example.com',
                'phone' => '+2519'.fake()->numerify('########'),
                'gender' => $gender,
                'date_of_birth' => fake()->dateTimeBetween('-45 years', '-22 years')->format('Y-m-d'),
                'address' => 'Addis Ababa, Ethiopia',
                'hire_date' => now()->subDays(random_int(10, 1400))->toDateString(),
                'department_id' => $departments[$dept]->id,
                'position_id' => $positions[$dept][$posIndex]->id,
                'employment_type' => $i % 7 === 6 ? 'contract' : 'full_time',
                'status' => 'active',
                'salary' => random_int(18, 95) * 1000,
                'emergency_contact_name' => fake()->name(),
                'emergency_contact_phone' => '+2519'.fake()->numerify('########'),
            ]);
        }

        // ---- a little activity so the dashboard isn't empty -----------------
        foreach ($employees as $employee) {
            for ($d = 1; $d <= 6; $d++) {
                $day = now()->subDays($d);
                if ($day->isWeekend()) {
                    continue;
                }
                $in = $day->copy()->setTime(8, random_int(0, 45));
                Attendance::create([
                    'employee_id' => $employee->id,
                    'date' => $day->toDateString(),
                    'clock_in' => $in,
                    'clock_out' => $in->copy()->addHours(8)->addMinutes(random_int(0, 40)),
                ]);
            }
        }

        $annual = $leaveTypes[0];
        $sick = $leaveTypes[1];
        $sampleEmployees = [$employees[1], $employees[3], $employees[8], $employees[11]];

        LeaveRequest::create([
            'employee_id' => $sampleEmployees[0]->id, 'leave_type_id' => $annual->id,
            'start_date' => now()->addDays(10)->toDateString(), 'end_date' => now()->addDays(14)->toDateString(),
            'days' => 5, 'reason' => 'Family visit', 'status' => 'pending',
        ]);
        LeaveRequest::create([
            'employee_id' => $sampleEmployees[1]->id, 'leave_type_id' => $sick->id,
            'start_date' => now()->addDays(2)->toDateString(), 'end_date' => now()->addDays(3)->toDateString(),
            'days' => 2, 'reason' => 'Medical appointment', 'status' => 'pending',
        ]);
        LeaveRequest::create([
            'employee_id' => $sampleEmployees[2]->id, 'leave_type_id' => $annual->id,
            'start_date' => now()->subDays(1)->toDateString(), 'end_date' => now()->addDays(2)->toDateString(),
            'days' => 4, 'reason' => 'Holiday', 'status' => 'approved',
            'reviewed_at' => now()->subDays(6),
        ]);
        LeaveRequest::create([
            'employee_id' => $sampleEmployees[3]->id, 'leave_type_id' => $annual->id,
            'start_date' => now()->subDays(30)->toDateString(), 'end_date' => now()->subDays(26)->toDateString(),
            'days' => 3, 'reason' => 'Personal', 'status' => 'rejected', 'review_note' => 'Project deadline that week.',
            'reviewed_at' => now()->subDays(33),
        ]);
    }
}
