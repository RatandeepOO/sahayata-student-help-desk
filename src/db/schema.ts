import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(), // 'student', 'technical', 'admin'
  name: text('name').notNull(),
  branch: text('branch'),
  rollNumber: text('roll_number'),
  semester: text('semester'),
  year: text('year'),
  gender: text('gender'), // 'male', 'female', 'other'
  dob: text('dob'),
  profilePicture: text('profile_picture'),
  phoneNumber: text('phone_number'),
  department: text('department'), // for technical team members
  points: integer('points').default(0),
  createdAt: text('created_at').notNull(),
});

// Complaints table
export const complaints = sqliteTable('complaints', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'electrical', 'mechanical', 'networking', 'plumbing', 'civil', 'other'
  difficulty: text('difficulty').notNull(), // 'easy', 'medium', 'hard'
  emergency: integer('emergency', { mode: 'boolean' }).notNull(),
  fixTillDate: text('fix_till_date').notNull(),
  photo: text('photo'),
  status: text('status').notNull().default('open'), // 'open', 'in-progress', 'resolved', 'closed'
  raisedBy: integer('raised_by').notNull().references(() => users.id),
  raisedByName: text('raised_by_name').notNull(),
  raisedByBranch: text('raised_by_branch'),
  raisedByProfilePic: text('raised_by_profile_pic'),
  volunteerId: integer('volunteer_id').references(() => users.id),
  volunteerName: text('volunteer_name'),
  createdAt: text('created_at').notNull(),
  resolvedAt: text('resolved_at'),
});

// Messages table
export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  senderId: integer('sender_id').notNull().references(() => users.id),
  senderName: text('sender_name').notNull(),
  receiverId: integer('receiver_id').notNull().references(() => users.id),
  complaintId: integer('complaint_id').references(() => complaints.id),
  content: text('content').notNull(),
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // 'complaint_resolved', 'new_message', 'complaint_accepted'
  message: text('message').notNull(),
  complaintId: integer('complaint_id').references(() => complaints.id),
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

// Technical team table
export const technicalTeam = sqliteTable('technical_team', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  department: text('department').notNull(),
  email: text('email').notNull(),
  phoneNumber: text('phone_number').notNull(),
  available: integer('available', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
});