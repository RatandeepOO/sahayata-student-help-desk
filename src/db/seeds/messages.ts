import { db } from '@/db';
import { messages } from '@/db/schema';

async function main() {
    const sampleMessages = [
        {
            senderId: 1,
            senderName: 'Rahul Sharma',
            receiverId: 16,
            complaintId: 1,
            content: 'Hi, any update on the fan repair in Classroom 305? It\'s been two days.',
            read: true,
            createdAt: new Date('2024-01-11T10:30:00').toISOString(),
        },
        {
            senderId: 16,
            senderName: 'Amit Kumar',
            receiverId: 1,
            complaintId: 1,
            content: 'We are working on it. The replacement fan has arrived. Will be fixed by tomorrow afternoon.',
            read: true,
            createdAt: new Date('2024-01-11T14:15:00').toISOString(),
        },
        {
            senderId: 3,
            senderName: 'Sneha Patel',
            receiverId: 17,
            complaintId: 5,
            content: 'The power outage is affecting the entire A-Block now. Can you prioritize this? We have exams next week.',
            read: false,
            createdAt: new Date('2024-01-16T09:45:00').toISOString(),
        },
        {
            senderId: 17,
            senderName: 'Priya Singh',
            receiverId: 3,
            complaintId: 5,
            content: 'I understand the urgency. Our team is already on site checking the main circuit breaker. I\'ll be there in 15 minutes to assess the situation.',
            read: false,
            createdAt: new Date('2024-01-16T10:00:00').toISOString(),
        },
        {
            senderId: 5,
            senderName: 'Aditya Verma',
            receiverId: 18,
            complaintId: 9,
            content: 'Could you provide access to Computer Lab 2? The door lock system is not working and we need to attend the programming lab.',
            read: true,
            createdAt: new Date('2024-01-19T11:20:00').toISOString(),
        },
        {
            senderId: 18,
            senderName: 'Rajesh Gupta',
            receiverId: 5,
            complaintId: 9,
            content: 'I\'ve coordinated with security. Lab access is temporarily open. We\'ll fix the electronic lock by evening.',
            read: true,
            createdAt: new Date('2024-01-19T11:45:00').toISOString(),
        },
        {
            senderId: 7,
            senderName: 'Kavya Reddy',
            receiverId: 19,
            complaintId: 12,
            content: 'Thanks for fixing the WiFi issue so quickly! The connection is stable now and working perfectly.',
            read: true,
            createdAt: new Date('2024-01-22T16:30:00').toISOString(),
        },
        {
            senderId: 19,
            senderName: 'Vikram Mehta',
            receiverId: 7,
            complaintId: 12,
            content: 'Glad to help! If you face any connectivity issues again, feel free to reach out anytime.',
            read: true,
            createdAt: new Date('2024-01-22T16:45:00').toISOString(),
        },
        {
            senderId: 20,
            senderName: 'Sanjay Rao',
            receiverId: 10,
            complaintId: 15,
            content: 'Can you confirm the exact location of the leaking tap? Is it in the washroom near the main entrance or the back side?',
            read: false,
            createdAt: new Date('2024-01-25T13:10:00').toISOString(),
        },
        {
            senderId: 10,
            senderName: 'Anjali Desai',
            receiverId: 20,
            complaintId: 15,
            content: 'It\'s in the girls washroom, second floor, near the back staircase. The leak has gotten worse since yesterday.',
            read: false,
            createdAt: new Date('2024-01-25T13:25:00').toISOString(),
        },
    ];

    await db.insert(messages).values(sampleMessages);
    
    console.log('✅ Messages seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});