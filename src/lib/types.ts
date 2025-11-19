export type UserRole = 'student' | 'technical' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  branch?: string;
  rollNumber?: string;
  semester?: string;
  year?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  profilePicture?: string;
  phoneNumber?: string;
  department?: string; // For technical team
  points?: number;
}

export type ComplaintStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type ComplaintDifficulty = 'easy' | 'medium' | 'hard';
export type ComplaintCategory = 'electrical' | 'mechanical' | 'networking' | 'plumbing' | 'civil' | 'other';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  difficulty: ComplaintDifficulty;
  emergency: boolean;
  fixTillDate: string;
  photo?: string;
  status: ComplaintStatus;
  raisedBy: string; // user id
  raisedByName: string;
  raisedByBranch?: string;
  raisedByProfilePic?: string;
  volunteerId?: string;
  volunteerName?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  complaintId?: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'complaint_resolved' | 'new_message' | 'complaint_accepted';
  message: string;
  complaintId?: string;
  read: boolean;
  timestamp: string;
}

export interface TechnicalTeamMember {
  id: string;
  name: string;
  department: string;
  email: string;
  phoneNumber: string;
  available: boolean;
}
