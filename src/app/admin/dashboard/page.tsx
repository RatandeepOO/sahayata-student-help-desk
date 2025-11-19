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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Trash2, MessageSquare, Send, Trophy } from 'lucide-react';
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
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

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
    if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/complaints?id=${complaintId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Complaint deleted successfully');
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete complaint');
      }
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast.error('Failed to delete complaint');
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

  const openMessageDialog = (student: User) => {
    setSelectedStudent(student);
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedStudent || !messageContent.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      // Send message
      const messageRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          senderName: user.name,
          receiverId: selectedStudent.id,
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
          userId: selectedStudent.id,
          type: 'new_message',
          message: `New message from Admin: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
        }),
      });

      toast.success('Message sent successfully');
      setMessageContent('');
      setMessageDialogOpen(false);
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
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Technical Team</h1>
                    <p className="text-gray-600 mt-1">Manage technical team availability</p>
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
                      <CardDescription>Manage availability status</CardDescription>
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
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Student Registry</h1>
                    <p className="text-gray-600 mt-1">View all registered students and their points</p>
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
                                    onClick={() => openMessageDialog(student)}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Message
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
              <DialogTitle>Send Message to {selectedStudent?.name}</DialogTitle>
              <DialogDescription>
                Send a direct message to this student
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
      </div>
    </FadeTransition>
  );
}