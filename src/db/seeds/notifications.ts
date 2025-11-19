import { db } from '@/db';
import { notifications } from '@/db/schema';

async function main() {
    const sampleNotifications = [
        // COMPLAINT_RESOLVED notifications (5)
        {
            userId: 3,
            type: 'complaint_resolved',
            message: "Your complaint 'Fan not working in Classroom 305' has been resolved",
            complaintId: 2,
            read: false,
            createdAt: new Date('2024-01-20T14:30:00').toISOString(),
        },
        {
            userId: 7,
            type: 'complaint_resolved',
            message: "Complaint about 'Water cooler leaking in Admin Block' is now closed",
            complaintId: 8,
            read: true,
            createdAt: new Date('2024-01-19T11:15:00').toISOString(),
        },
        {
            userId: 5,
            type: 'complaint_resolved',
            message: "Your issue 'WiFi not working in Library' has been successfully fixed",
            complaintId: 5,
            read: false,
            createdAt: new Date('2024-01-18T16:45:00').toISOString(),
        },
        {
            userId: 12,
            type: 'complaint_resolved',
            message: "Complaint 'Tap leaking in Boys Washroom' has been marked as resolved",
            complaintId: 12,
            read: true,
            createdAt: new Date('2024-01-17T09:20:00').toISOString(),
        },
        {
            userId: 9,
            type: 'complaint_resolved',
            message: "Your complaint 'Broken door handle in Cafeteria' is now resolved",
            complaintId: 14,
            read: false,
            createdAt: new Date('2024-01-16T13:00:00').toISOString(),
        },
        
        // NEW_MESSAGE notifications (6)
        {
            userId: 4,
            type: 'new_message',
            message: 'Rajesh Kumar sent you a message about your complaint',
            complaintId: 4,
            read: false,
            createdAt: new Date('2024-01-20T15:45:00').toISOString(),
        },
        {
            userId: 6,
            type: 'new_message',
            message: 'You have a new message from Suresh Babu regarding WiFi issue',
            complaintId: 6,
            read: false,
            createdAt: new Date('2024-01-20T10:30:00').toISOString(),
        },
        {
            userId: 8,
            type: 'new_message',
            message: 'New message from Rahul Sharma about complaint #3',
            complaintId: 3,
            read: true,
            createdAt: new Date('2024-01-19T14:20:00').toISOString(),
        },
        {
            userId: 10,
            type: 'new_message',
            message: 'Manoj Singh replied to your complaint',
            complaintId: 10,
            read: false,
            createdAt: new Date('2024-01-19T08:15:00').toISOString(),
        },
        {
            userId: 11,
            type: 'new_message',
            message: 'You received a message from technical team',
            complaintId: 11,
            read: false,
            createdAt: new Date('2024-01-18T12:00:00').toISOString(),
        },
        {
            userId: 13,
            type: 'new_message',
            message: 'New message about your plumbing complaint',
            complaintId: 13,
            read: false,
            createdAt: new Date('2024-01-17T15:30:00').toISOString(),
        },
        
        // COMPLAINT_ACCEPTED notifications (4)
        {
            userId: 1,
            type: 'complaint_accepted',
            message: 'Your complaint has been accepted by Rajesh Kumar',
            complaintId: 1,
            read: true,
            createdAt: new Date('2024-01-20T09:00:00').toISOString(),
        },
        {
            userId: 2,
            type: 'complaint_accepted',
            message: 'Suresh Babu is now working on your complaint',
            complaintId: 7,
            read: false,
            createdAt: new Date('2024-01-19T10:45:00').toISOString(),
        },
        {
            userId: 14,
            type: 'complaint_accepted',
            message: 'Manoj Singh accepted your networking issue',
            complaintId: 15,
            read: false,
            createdAt: new Date('2024-01-18T11:30:00').toISOString(),
        },
        {
            userId: 15,
            type: 'complaint_accepted',
            message: 'Technical team member assigned to your complaint',
            complaintId: 16,
            read: false,
            createdAt: new Date('2024-01-17T13:15:00').toISOString(),
        },
    ];

    await db.insert(notifications).values(sampleNotifications);
    
    console.log('✅ Notifications seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});