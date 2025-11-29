import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
    const adminUsers = [
        {
            email: 'cse@sahayata.com',
            password: 'CSEADMIN',
            name: 'CSE Admin',
            department: 'CSE',
            role: 'admin',
            profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            points: 0,
            branch: null,
            rollNumber: null,
            semester: null,
            year: null,
            gender: null,
            dob: null,
            phoneNumber: null,
            createdAt: new Date().toISOString(),
        },
        {
            email: 'elex@sahayata.com',
            password: 'ELEXADMIN',
            name: 'Electronics Admin',
            department: 'Electronics',
            role: 'admin',
            profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            points: 0,
            branch: null,
            rollNumber: null,
            semester: null,
            year: null,
            gender: null,
            dob: null,
            phoneNumber: null,
            createdAt: new Date().toISOString(),
        },
        {
            email: 'pharma@sahayata.com',
            password: 'PHARMAADMIN',
            name: 'Pharmacy Admin',
            department: 'Pharmacy',
            role: 'admin',
            profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            points: 0,
            branch: null,
            rollNumber: null,
            semester: null,
            year: null,
            gender: null,
            dob: null,
            phoneNumber: null,
            createdAt: new Date().toISOString(),
        },
        {
            email: 'mech@sahayata.com',
            password: 'MECHADMIN',
            name: 'Mechanical Admin',
            department: 'Mechanical',
            role: 'admin',
            profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            points: 0,
            branch: null,
            rollNumber: null,
            semester: null,
            year: null,
            gender: null,
            dob: null,
            phoneNumber: null,
            createdAt: new Date().toISOString(),
        },
        {
            email: 'elec@sahayata.com',
            password: 'ELECADMIN',
            name: 'Electrical Admin',
            department: 'Electrical',
            role: 'admin',
            profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            points: 0,
            branch: null,
            rollNumber: null,
            semester: null,
            year: null,
            gender: null,
            dob: null,
            phoneNumber: null,
            createdAt: new Date().toISOString(),
        },
    ];

    const existingEmails = await db.select({ email: users.email }).from(users);
    const existingEmailsLowerCase = existingEmails.map(u => u.email.toLowerCase());

    const adminsToInsert = adminUsers.filter(admin => 
        !existingEmailsLowerCase.includes(admin.email.toLowerCase())
    );

    const skippedAdmins = adminUsers.filter(admin => 
        existingEmailsLowerCase.includes(admin.email.toLowerCase())
    );

    if (adminsToInsert.length === 0) {
        console.log('⏭️  All admin users already exist. Skipped:');
        skippedAdmins.forEach(admin => {
            console.log(`   - ${admin.email} (${admin.name})`);
        });
        console.log('✅ Admin users seeder completed - no new admins created');
        return;
    }

    await db.insert(users).values(adminsToInsert);

    console.log('✅ Admin users seeder completed successfully');
    console.log(`📝 Created ${adminsToInsert.length} admin user(s):`);
    adminsToInsert.forEach(admin => {
        console.log(`   ✓ ${admin.email} (${admin.name} - ${admin.department})`);
    });

    if (skippedAdmins.length > 0) {
        console.log(`⏭️  Skipped ${skippedAdmins.length} existing admin(s):`);
        skippedAdmins.forEach(admin => {
            console.log(`   - ${admin.email} (${admin.name})`);
        });
    }
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});