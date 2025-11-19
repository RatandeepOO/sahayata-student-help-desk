import { User, Complaint, Message, Notification, TechnicalTeamMember } from './types';

// Admin credentials
export const ADMIN_CREDENTIALS = [
  { email: 'cse@sahayata.com', password: 'CSEADMIN', department: 'CSE' },
  { email: 'elex@sahayata.com', password: 'ELEXADMIN', department: 'Electronics' },
  { email: 'pharma@sahayata.com', password: 'PHARMAADMIN', department: 'Pharmacy' },
  { email: 'mech@sahayata.com', password: 'MECHADMIN', department: 'Mechanical' },
  { email: 'elec@sahayata.com', password: 'ELECADMIN', department: 'Electrical' },
];

export const isAdminCredential = (email: string, password: string) => {
  return ADMIN_CREDENTIALS.some(
    (admin) => admin.email === email && admin.password === password
  );
};

export const getAdminDepartment = (email: string) => {
  const admin = ADMIN_CREDENTIALS.find((a) => a.email === email);
  return admin?.department || '';
};

// LocalStorage keys
const USERS_KEY = 'sahayata_users';
const CURRENT_USER_KEY = 'sahayata_current_user';
const COMPLAINTS_KEY = 'sahayata_complaints';
const MESSAGES_KEY = 'sahayata_messages';
const NOTIFICATIONS_KEY = 'sahayata_notifications';
const TECHNICAL_TEAM_KEY = 'sahayata_technical_team';

// User operations
export const saveUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const getUserById = (id: string): User | undefined => {
  const users = getUsers();
  return users.find((u) => u.id === id);
};

export const updateUser = (userId: string, updates: Partial<User>) => {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const setCurrentUser = (user: User) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Complaint operations
export const saveComplaint = (complaint: Complaint) => {
  const complaints = getComplaints();
  complaints.push(complaint);
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
};

export const getComplaints = (): Complaint[] => {
  if (typeof window === 'undefined') return [];
  const complaints = localStorage.getItem(COMPLAINTS_KEY);
  return complaints ? JSON.parse(complaints) : [];
};

export const updateComplaint = (complaintId: string, updates: Partial<Complaint>) => {
  const complaints = getComplaints();
  const index = complaints.findIndex((c) => c.id === complaintId);
  if (index !== -1) {
    complaints[index] = { ...complaints[index], ...updates };
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
  }
};

export const deleteComplaint = (complaintId: string) => {
  const complaints = getComplaints().filter((c) => c.id !== complaintId);
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
};

// Message operations
export const saveMessage = (message: Message) => {
  const messages = getMessages();
  messages.push(message);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
};

export const getMessages = (): Message[] => {
  if (typeof window === 'undefined') return [];
  const messages = localStorage.getItem(MESSAGES_KEY);
  return messages ? JSON.parse(messages) : [];
};

export const markMessageAsRead = (messageId: string) => {
  const messages = getMessages();
  const index = messages.findIndex((m) => m.id === messageId);
  if (index !== -1) {
    messages[index].read = true;
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }
};

// Notification operations
export const saveNotification = (notification: Notification) => {
  const notifications = getNotifications();
  notifications.push(notification);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const getNotifications = (): Notification[] => {
  if (typeof window === 'undefined') return [];
  const notifications = localStorage.getItem(NOTIFICATIONS_KEY);
  return notifications ? JSON.parse(notifications) : [];
};

export const markNotificationAsRead = (notificationId: string) => {
  const notifications = getNotifications();
  const index = notifications.findIndex((n) => n.id === notificationId);
  if (index !== -1) {
    notifications[index].read = true;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
};

// Technical team operations
export const saveTechnicalMember = (member: TechnicalTeamMember) => {
  const team = getTechnicalTeam();
  team.push(member);
  localStorage.setItem(TECHNICAL_TEAM_KEY, JSON.stringify(team));
};

export const getTechnicalTeam = (): TechnicalTeamMember[] => {
  if (typeof window === 'undefined') return [];
  const team = localStorage.getItem(TECHNICAL_TEAM_KEY);
  return team ? JSON.parse(team) : [];
};

export const updateTechnicalMember = (memberId: string, updates: Partial<TechnicalTeamMember>) => {
  const team = getTechnicalTeam();
  const index = team.findIndex((m) => m.id === memberId);
  if (index !== -1) {
    team[index] = { ...team[index], ...updates };
    localStorage.setItem(TECHNICAL_TEAM_KEY, JSON.stringify(team));
  }
};
