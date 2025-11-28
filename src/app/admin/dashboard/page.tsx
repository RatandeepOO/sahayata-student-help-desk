'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FadeTransition from '@/components/FadeTransition';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/storage';
import { User, Complaint, TechnicalTeamMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, MessageSquare, Send, Trophy, UserPlus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('complaints');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [technicalTeam, setTechnicalTeam] = useState<TechnicalTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Message dialog state
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: number; name: string; type: 'student' | 'tech' } | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add student dialog state
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: '',
    branch: '',
    rollNumber: '',
    semester: '',
    year: '',
    gender: 'male' as 'male' | 'female' | 'other',
    phoneNumber: '',
  });
  const [addingStudent, setAddingStudent] = useState(false);

  // Add technical team dialog state
  const [addTechDialogOpen, setAddTechDialogOpen] = useState(false);
  const [techForm, setTechForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    phoneNumber: '',
  });
  const [addingTech, setAddingTech] = useState(false);

  // Delete student/tech dialog
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; type: 'student' | 'tech'; name: string } | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/auth');
      return;
    }
    setUser(currentUser);
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load complaints
      const complaintsRes = await fetch('/api/complaints?limit=100');
      if (complaintsRes.ok) {
        const complaintsData = await complaintsRes.json();
        setComplaints(complaintsData);
      }

      // Load students
      const studentsRes = await fetch('/api/users?role=student&limit=100');
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      // Load technical team
      const techTeamRes = await fetch('/api/technical-team?limit=100');
      if (techTeamRes.ok) {
        const techTeamData = await techTeamRes.json();
        setTechnicalTeam(techTeamData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComplaint = async (complaintId: number) => {
    setComplaintToDelete(complaintId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!complaintToDelete || deleting) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/complaints?id=${complaintToDelete}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Complaint deleted successfully');
        setDeleteDialogOpen(false);
        setComplaintToDelete(null);
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete complaint');
      }
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast.error('Failed to delete complaint');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleAvailability = async (memberId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/technical-team?id=${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !currentStatus }),
      });

      if (res.ok) {
        toast.success('Availability updated');
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const openMessageDialog = (recipientId: number, recipientName: string, type: 'student' | 'tech') => {
    setSelectedRecipient({ id: recipientId, name: recipientName, type });
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedRecipient || !messageContent.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      // Send message
      const messageRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          senderName: user.name,
          receiverId: selectedRecipient.id,
          content: messageContent.trim(),
        }),
      });

      if (!messageRes.ok) {
        const error = await messageRes.json();
        toast.error(error.error || 'Failed to send message');
        return;
      }

      // Send notification
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedRecipient.id,
          type: 'new_message',
          message: `New message from Admin: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
        }),
      });

      toast.success('Message sent successfully');
      setMessageContent('');
      setMessageDialogOpen(false);
      
      // Redirect to messages page with userId parameter to auto-open conversation
      router.push(`/messages?userId=${selectedRecipient.id}`);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddStudent = async () => {
    if (addingStudent) return;

    // Validation
    if (!studentForm.name || !studentForm.email || !studentForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAddingStudent(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studentForm,
          role: 'student',
          profilePicture: studentForm.gender === 'male' 
            ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=male'
            : studentForm.gender === 'female'
            ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=female'
            : 'https://api.dicebear.com/7.x/avataaars/svg?seed=other',
        }),
      });

      if (res.ok) {
        toast.success('Student added successfully');
        setAddStudentDialogOpen(false);
        setStudentForm({
          name: '',
          email: '',
          password: '',
          branch: '',
          rollNumber: '',
          semester: '',
          year: '',
          gender: 'male',
          phoneNumber: '',
        });
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleAddTechnicalMember = async () => {
    if (addingTech) return;

    // Validation
    if (!techForm.name || !techForm.email || !techForm.password || !techForm.department || !techForm.phoneNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAddingTech(true);
    try {
      // First, create user account
      const userRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: techForm.name,
          email: techForm.email,
          password: techForm.password,
          role: 'technical',
          department: techForm.department,
          phoneNumber: techForm.phoneNumber,
        }),
      });

      if (!userRes.ok) {
        const error = await userRes.json();
        toast.error(error.error || 'Failed to create user account');
        setAddingTech(false);
        return;
      }

      const newUser = await userRes.json();

      // Then, add to technical team table
      const techRes = await fetch('/api/technical-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newUser.id,
          name: techForm.name,
          department: techForm.department,
          email: techForm.email,
          phoneNumber: techForm.phoneNumber,
          available: true,
        }),
      });

      if (techRes.ok) {
        toast.success('Technical team member added successfully');
        setAddTechDialogOpen(false);
        setTechForm({
          name: '',
          email: '',
          password: '',
          department: '',
          phoneNumber: '',
        });
        loadData();
      } else {
        const error = await techRes.json();
        toast.error(error.error || 'Failed to add to technical team');
      }
    } catch (error) {
      console.error('Error adding technical member:', error);
      toast.error('Failed to add technical member');
    } finally {
      setAddingTech(false);
    }
  };

  const handleDeleteUser = (id: string, type: 'student' | 'tech', name: string) => {
    setUserToDelete({ id, type, name });
    setDeleteUserDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || deletingUser) return;

    setDeletingUser(true);
    try {
      if (userToDelete.type === 'tech') {
        // Delete from technical team table first
        const techRes = await fetch(`/api/technical-team?id=${userToDelete.id}`, {
          method: 'DELETE',
        });

        if (!techRes.ok) {
          const error = await techRes.json();
          toast.error(error.error || 'Failed to delete technical team member');
          setDeletingUser(false);
          return;
        }

        // Get the technical team member to find userId
        const techMember = technicalTeam.find(m => m.id === parseInt(userToDelete.id));
        if (techMember) {
          // Delete user account
          await fetch(`/api/users?id=${techMember.userId}`, {
            method: 'DELETE',
          });
        }
      } else {
        // Delete student user account
        const res = await fetch(`/api/users?id=${userToDelete.id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || 'Failed to delete student');
          setDeletingUser(false);
          return;
        }
      }

      toast.success(`${userToDelete.type === 'tech' ? 'Technical team member' : 'Student'} deleted successfully`);
      setDeleteUserDialogOpen(false);
      setUserToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setDeletingUser(false);
    }
  };

  const tabs = [
    { id: 'complaints', label: 'Complaints' },
    { id: 'technical', label: 'Technical Team' },
    { id: 'students', label: 'Students' },
  ];

  if (!user) return null;

  return (
    <FadeTransition>
      <div className="min-h-screen bg-gray-50">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'complaints' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Complaints Management</h1>
                    <p className="text-gray-600 mt-1">Monitor and manage all complaints</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Complaints</CardDescription>
                        <CardTitle className="text-3xl">{complaints.length}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Open</CardDescription>
                        <CardTitle className="text-3xl text-yellow-600">
                          {complaints.filter((c) => c.status === 'open').length}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>In Progress</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">
                          {complaints.filter((c) => c.status === 'in-progress').length}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Resolved</CardDescription>
                        <CardTitle className="text-3xl text-green-600">
                          {complaints.filter((c) => c.status === 'resolved').length}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* All Complaints */}
                  <Card>
                    <CardHeader>
                      <CardTitle>All Complaints</CardTitle>
                      <CardDescription>Review and manage complaints</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {complaints.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No complaints yet.</p>
                        ) : (
                          complaints
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((complaint) => (
                              <div
                                key={complaint.id}
                                className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                {complaint.raisedByProfilePic && (
                                  <Avatar>
                                    <AvatarImage src={complaint.raisedByProfilePic} />
                                    <AvatarFallback>{complaint.raisedByName[0]}</AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                                    <div className="flex items-center space-x-2">
                                      <Badge className={getStatusColor(complaint.status)}>
                                        {complaint.status}
                                      </Badge>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteComplaint(complaint.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    By {complaint.raisedByName} • {complaint.raisedByBranch}
                                  </p>
                                  <p className="text-gray-600 mt-2">{complaint.description}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <Badge variant="outline">{complaint.category}</Badge>
                                    <Badge variant="outline">{complaint.difficulty}</Badge>
                                    {complaint.emergency && (
                                      <Badge variant="destructive">Emergency</Badge>
                                    )}
                                  </div>
                                  {complaint.volunteerName && (
                                    <p className="text-sm text-green-600 mt-2">
                                      Volunteer: {complaint.volunteerName}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-2">
                                    Created: {format(new Date(complaint.createdAt), 'PPP')}
                                  </p>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'technical' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Technical Team</h1>
                      <p className="text-gray-600 mt-1">Manage technical team members and availability</p>
                    </div>
                    <Button onClick={() => setAddTechDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Members</CardDescription>
                        <CardTitle className="text-3xl">{technicalTeam.length}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Available</CardDescription>
                        <CardTitle className="text-3xl text-green-600">
                          {technicalTeam.filter((m) => m.available).length}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Team Members</CardTitle>
                      <CardDescription>Manage availability status and members</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {technicalTeam.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No technical team members yet.</p>
                        ) : (
                          technicalTeam.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-600 font-semibold">{member.name[0]}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{member.name}</p>
                                  <p className="text-sm text-gray-500">{member.department}</p>
                                  <p className="text-sm text-gray-500">{member.email}</p>
                                  <p className="text-sm text-gray-500">{member.phoneNumber}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    {member.available ? (
                                      <span className="text-green-600">Available</span>
                                    ) : (
                                      <span className="text-red-600">Unavailable</span>
                                    )}
                                  </p>
                                </div>
                                <Switch
                                  checked={member.available}
                                  onCheckedChange={() => handleToggleAvailability(member.id, member.available)}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openMessageDialog(member.userId || member.id, member.name, 'tech')}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(member.id.toString(), 'tech', member.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'students' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Student Registry</h1>
                      <p className="text-gray-600 mt-1">View and manage registered students</p>
                    </div>
                    <Button onClick={() => setAddStudentDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Students</CardDescription>
                      <CardTitle className="text-3xl">{students.length}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>All Students</CardTitle>
                      <CardDescription>Student information and points</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {students.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No students registered yet.</p>
                        ) : (
                          students
                            .sort((a, b) => (b.points || 0) - (a.points || 0))
                            .map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex items-center space-x-4">
                                  <Avatar>
                                    <AvatarImage src={student.profilePicture} />
                                    <AvatarFallback>{student.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold text-gray-900">{student.name}</p>
                                    <p className="text-sm text-gray-500">{student.branch}</p>
                                    <p className="text-sm text-gray-500">Roll: {student.rollNumber}</p>
                                    <p className="text-sm text-gray-500">{student.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <div className="flex items-center space-x-1">
                                      <Trophy className="h-4 w-4 text-yellow-500" />
                                      <span className="font-bold text-gray-900">{student.points || 0}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">points</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openMessageDialog(student.id, student.name, 'student')}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Message
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteUser(student.id.toString(), 'student', student.name)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </main>

        {/* Message Dialog */}
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message to {selectedRecipient?.name}</DialogTitle>
              <DialogDescription>
                Send a direct message to this {selectedRecipient?.type === 'student' ? 'student' : 'technical team member'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setMessageDialogOpen(false)} disabled={sendingMessage}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} disabled={sendingMessage || !messageContent.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Complaint</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this complaint? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Student Dialog */}
        <Dialog open={addStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Add a new student to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">Name *</Label>
                <Input
                  id="student-name"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="Enter student name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-email">Email *</Label>
                <Input
                  id="student-email"
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  placeholder="student@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-password">Password *</Label>
                <Input
                  id="student-password"
                  type="password"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student-branch">Branch</Label>
                  <Input
                    id="student-branch"
                    value={studentForm.branch}
                    onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                    placeholder="e.g., CSE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-roll">Roll Number</Label>
                  <Input
                    id="student-roll"
                    value={studentForm.rollNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                    placeholder="e.g., 2021001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student-semester">Semester</Label>
                  <Input
                    id="student-semester"
                    value={studentForm.semester}
                    onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                    placeholder="e.g., 6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-year">Year</Label>
                  <Input
                    id="student-year"
                    value={studentForm.year}
                    onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                    placeholder="e.g., 2024"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-gender">Gender</Label>
                <Select
                  value={studentForm.gender}
                  onValueChange={(value: 'male' | 'female' | 'other') => setStudentForm({ ...studentForm, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-phone">Phone Number</Label>
                <Input
                  id="student-phone"
                  value={studentForm.phoneNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, phoneNumber: e.target.value })}
                  placeholder="e.g., +91 9876543210"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setAddStudentDialogOpen(false)} disabled={addingStudent}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent} disabled={addingStudent}>
                  {addingStudent ? 'Adding...' : 'Add Student'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Technical Team Member Dialog */}
        <Dialog open={addTechDialogOpen} onOpenChange={setAddTechDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Technical Team Member</DialogTitle>
              <DialogDescription>
                Add a new member to the technical team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tech-name">Name *</Label>
                <Input
                  id="tech-name"
                  value={techForm.name}
                  onChange={(e) => setTechForm({ ...techForm, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech-email">Email *</Label>
                <Input
                  id="tech-email"
                  type="email"
                  value={techForm.email}
                  onChange={(e) => setTechForm({ ...techForm, email: e.target.value })}
                  placeholder="tech@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech-password">Password *</Label>
                <Input
                  id="tech-password"
                  type="password"
                  value={techForm.password}
                  onChange={(e) => setTechForm({ ...techForm, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech-department">Department *</Label>
                <Select
                  value={techForm.department}
                  onValueChange={(value) => setTechForm({ ...techForm, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech-phone">Phone Number *</Label>
                <Input
                  id="tech-phone"
                  value={techForm.phoneNumber}
                  onChange={(e) => setTechForm({ ...techForm, phoneNumber: e.target.value })}
                  placeholder="e.g., +91 9876543210"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setAddTechDialogOpen(false)} disabled={addingTech}>
                  Cancel
                </Button>
                <Button onClick={handleAddTechnicalMember} disabled={addingTech}>
                  {addingTech ? 'Adding...' : 'Add Member'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <Dialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {userToDelete?.type === 'tech' ? 'Technical Team Member' : 'Student'}</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setDeleteUserDialogOpen(false)} disabled={deletingUser}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteUser} disabled={deletingUser}>
                {deletingUser ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FadeTransition>
  );
}