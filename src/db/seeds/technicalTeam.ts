import { db } from '@/db';
import { technicalTeam } from '@/db/schema';

async function main() {
    const sampleTechnicalTeam = [
        {
            userId: 16,
            name: 'Rajesh Kumar',
            department: 'electrical',
            email: 'rajesh.kumar@tech.college.edu',
            phoneNumber: '+91-9876543210',
            available: true,
            createdAt: new Date('2024-06-15').toISOString(),
        },
        {
            userId: 17,
            name: 'Suresh Babu',
            department: 'mechanical',
            email: 'suresh.babu@tech.college.edu',
            phoneNumber: '+91-9876543211',
            available: true,
            createdAt: new Date('2024-07-10').toISOString(),
        },
        {
            userId: 18,
            name: 'Manoj Singh',
            department: 'networking',
            email: 'manoj.singh@tech.college.edu',
            phoneNumber: '+91-9876543212',
            available: false,
            createdAt: new Date('2024-08-05').toISOString(),
        },
        {
            userId: 19,
            name: 'Ramesh Verma',
            department: 'plumbing',
            email: 'ramesh.verma@tech.college.edu',
            phoneNumber: '+91-9876543213',
            available: true,
            createdAt: new Date('2024-09-20').toISOString(),
        },
        {
            userId: 20,
            name: 'Sanjay Patel',
            department: 'civil',
            email: 'sanjay.patel@tech.college.edu',
            phoneNumber: '+91-9876543214',
            available: true,
            createdAt: new Date('2024-10-12').toISOString(),
        },
    ];

    await db.insert(technicalTeam).values(sampleTechnicalTeam);
    
    console.log('✅ Technical team seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});