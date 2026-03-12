<?php
// =============================================================
//  DatabaseSeeder — Seeds the initial admin user
//  Run with: php artisan db:seed
//  Or fresh migration + seed: php artisan migrate:fresh --seed
// =============================================================

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create the default admin user
        // IMPORTANT: Change the password after first login!
        User::firstOrCreate(
            ['email' => 'admin@ceyntics.com'],
            [
                'name'     => 'System Administrator',
                'password' => Hash::make('Admin@1234'),
                'role'     => 'admin',
            ]
        );

        // Create a sample staff user for testing
        User::firstOrCreate(
            ['email' => 'staff@ceyntics.com'],
            [
                'name'     => 'Staff Member',
                'password' => Hash::make('Staff@1234'),
                'role'     => 'staff',
            ]
        );

        $this->command->info('✓ Admin user: admin@ceyntics.com / Admin@1234');
        $this->command->info('✓ Staff user: staff@ceyntics.com / Staff@1234');
        $this->command->warn('⚠  Change these passwords after first login!');
    }
}
