'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FadeTransition from '@/components/FadeTransition';
import Navbar from '@/components/Navbar';
import { getCurrentUser, getComplaints, saveComplaint, getUsers, saveNotification, updateComplaint, updateUser, getUserById, saveMessage } from '@/lib/storage';
import { User, Complaint, Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CalendarIcon, Plus, AlertCircle, CheckCircle2, Clock, FileText, MessageSquare, Trophy, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getPointsForDifficulty } from '@/lib/avatar';
import Image from 'next/image';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [emergency, setEmergency] = useState(false);
  const [fixTillDate, setFixTillDate] = useState<Date>();
  const [photo, setPhoto] = useState('');
  
  // Chat state
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
      router.push('/auth');
      return;
    }
    setUser(currentUser);
    loadComplaints(currentUser.id);
  }, [router]);

  const loadComplaints = (userId: string) => {
    const allComplaints = getComplaints();
    setComplaints(allComplaints);
    setUserComplaints(allComplaints.filter((c) => c.raisedBy === userId));
  };

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !title || !category || !difficulty || !fixTillDate) {
      return;
    }

    const newComplaint: Complaint = {
      id: 'complaint-' + Date.now(),
      title,
      description,
      category: category as any,
      difficulty: difficulty as any,
      emergency,
      fixTillDate: format(fixTillDate, 'yyyy-MM-dd'),
      photo,
      status: 'open',
      raisedBy: user.id,
      raisedByName: user.name,
      raisedByBranch: user.branch,
      raisedByProfilePic: user.profilePicture,
      createdAt: new Date().toISOString(),
    };

    saveComplaint(newComplaint);
    loadComplaints(user.id);
    
    // Reset form
    setTitle('');
    setDescription('');
    setCategory('');
    setDifficulty('');
    setEmergency(false);
    setFixTillDate(undefined);
    setPhoto('');
    setDialogOpen(false);
  };

  const handleVolunteer = (complaint: Complaint) => {
    if (!user) return;
    
    updateComplaint(complaint.id, {
      status: 'in-progress',
      volunteerId: user.id,
      volunteerName: user.name,
    });
    
    // Send notification to complaint raiser
    saveNotification({
      id: 'notif-' + Date.now(),
      userId: complaint.raisedBy,
      type: 'complaint_accepted',
      message: `${user.name} has volunteered to help with your complaint: "${complaint.title}"`,
      complaintId: complaint.id,
      read: false,
      timestamp: new Date().toISOString(),
    });
    
    loadComplaints(user.id);
  };
  
  const handleResolveComplaint = (complaint: Complaint) => {
    if (!user || complaint.volunteerId !== user.id) return;
    
    updateComplaint(complaint.id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
    
    // Award points
    const points = getPointsForDifficulty(complaint.difficulty);
    const currentPoints = user.points || 0;
    updateUser(user.id, { points: currentPoints + points });
    setUser({ ...user, points: currentPoints + points });
    
    // Send notification
    saveNotification({
      id: 'notif-' + Date.now(),
      userId: complaint.raisedBy,
      type: 'complaint_resolved',
      message: `Your complaint "${complaint.title}" has been resolved by ${user.name}!`,
      complaintId: complaint.id,
      read: false,
      timestamp: new Date().toISOString(),
    });
    
    loadComplaints(user.id);
  };

  const openChat = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setChatDialogOpen(true);
  };
  
  const handleSendMessage = () => {
    if (!user || !selectedComplaint || !chatMessage.trim()) return;
    
    const receiverId = selectedComplaint.volunteerId === user.id 
      ? selectedComplaint.raisedBy 
      : selectedComplaint.volunteerId || '';
    
    const receiverUser = getUserById(receiverId);
    if (!receiverUser) return;
    
    const message: Message = {
      id: 'msg-' + Date.now(),
      senderId: user.id,
      senderName: user.name,
      receiverId,
      complaintId: selectedComplaint.id,
      content: chatMessage,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    saveMessage(message);
    
    // Send notification
    saveNotification({
      id: 'notif-' + Date.now(),
      userId: receiverId,
      type: 'new_message',
      message: `New message from ${user.name} about "${selectedComplaint.title}"`,
      complaintId: selectedComplaint.id,
      read: false,
      timestamp: new Date().toISOString(),
    });
    
    setChatMessage('');
  };

  const getChartData = () => {
    const raised = userComplaints.length;
    const resolved = userComplaints.filter((c) => c.status === 'resolved').length;
    const inProgress = userComplaints.filter((c) => c.status === 'in-progress').length;
    const open = userComplaints.filter((c) => c.status === 'open').length;

    return [
      { name: 'Open', value: open, fill: 'hsl(var(--chart-1))' },
      { name: 'In Progress', value: inProgress, fill: 'hsl(var(--chart-2))' },
      { name: 'Resolved', value: resolved, fill: 'hsl(var(--chart-3))' },
    ];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4" />;
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
  
  const getLeaderboardData = () => {
    const users = getUsers().filter((u) => u.role === 'student');
    return users
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 20);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'volunteer', label: 'Volunteer' },
    { id: 'leaderboard', label: 'Leaderboard' },
  ];

  if (!user) return null;

  return (
    <FadeTransition>
      <div className="min-h-screen bg-gray-50">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-1">Manage your complaints and track progress</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Raise Complaint</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Raise a New Complaint</DialogTitle>
                      <DialogDescription>
                        Fill in the details below to submit your complaint
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitComplaint} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Brief description of the issue"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Detailed description of the problem"
                          rows={4}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="electrical">Electrical</SelectItem>
                              <SelectItem value="mechanical">Mechanical</SelectItem>
                              <SelectItem value="networking">Networking</SelectItem>
                              <SelectItem value="plumbing">Plumbing</SelectItem>
                              <SelectItem value="civil">Civil</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="difficulty">Difficulty *</Label>
                          <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy (10 points)</SelectItem>
                              <SelectItem value="medium">Medium (25 points)</SelectItem>
                              <SelectItem value="hard">Hard (50 points)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fixTillDate">Fix Till Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !fixTillDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {fixTillDate ? format(fixTillDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={fixTillDate}
                              onSelect={setFixTillDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="photo">Photo URL (Optional)</Label>
                        <Input
                          id="photo"
                          value={photo}
                          onChange={(e) => setPhoto(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="emergency"
                          checked={emergency}
                          onCheckedChange={setEmergency}
                        />
                        <Label htmlFor="emergency" className="cursor-pointer">
                          Mark as Emergency
                        </Label>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Submit Complaint</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Complaints</CardDescription>
                    <CardTitle className="text-3xl">{userComplaints.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Open</CardDescription>
                    <CardTitle className="text-3xl text-yellow-600">
                      {userComplaints.filter((c) => c.status === 'open').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>In Progress</CardDescription>
                    <CardTitle className="text-3xl text-blue-600">
                      {userComplaints.filter((c) => c.status === 'in-progress').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Resolved</CardDescription>
                    <CardTitle className="text-3xl text-green-600">
                      {userComplaints.filter((c) => c.status === 'resolved').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Complaint Statistics</CardTitle>
                  <CardDescription>Overview of your complaint status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="currentColor" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Previous Complaints */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Complaints</CardTitle>
                  <CardDescription>History of all your submitted complaints</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userComplaints.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No complaints yet. Click "Raise Complaint" to submit one.
                      </p>
                    ) : (
                      userComplaints.map((complaint) => (
                        <div
                          key={complaint.id}
                          className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(complaint.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                              <Badge className={getStatusColor(complaint.status)}>
                                {complaint.status}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mt-1">{complaint.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline">{complaint.category}</Badge>
                              <Badge variant="outline">{complaint.difficulty}</Badge>
                              {complaint.emergency && (
                                <Badge variant="destructive">Emergency</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              Fix by: {format(new Date(complaint.fixTillDate), 'PPP')}
                            </p>
                            {complaint.volunteerName && (
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-green-600">
                                  Volunteer: {complaint.volunteerName}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openChat(complaint)}
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Chat
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'volunteer' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Volunteer</h1>
                <p className="text-gray-600 mt-1">Help your peers by volunteering to fix their complaints</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Your Points</CardDescription>
                    <CardTitle className="text-3xl text-blue-600">{user.points || 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Problems Volunteered</CardDescription>
                    <CardTitle className="text-3xl">
                      {complaints.filter((c) => c.volunteerId === user.id).length}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Open Complaints</CardTitle>
                  <CardDescription>Help fellow students by volunteering to solve these issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complaints.filter((c) => c.status === 'open').length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No open complaints at the moment. Check back later!
                      </p>
                    ) : (
                      complaints
                        .filter((c) => c.status === 'open')
                        .sort((a, b) => {
                          if (a.emergency && !b.emergency) return -1;
                          if (!a.emergency && b.emergency) return 1;
                          return new Date(a.fixTillDate).getTime() - new Date(b.fixTillDate).getTime();
                        })
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
                                <Button
                                  size="sm"
                                  onClick={() => handleVolunteer(complaint)}
                                >
                                  Volunteer
                                </Button>
                              </div>
                              <p className="text-sm text-gray-500">
                                By {complaint.raisedByName} • {complaint.raisedByBranch}
                              </p>
                              <p className="text-gray-600 mt-2">{complaint.description}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">{complaint.category}</Badge>
                                <Badge variant="outline">
                                  {complaint.difficulty} ({getPointsForDifficulty(complaint.difficulty)} points)
                                </Badge>
                                {complaint.emergency && (
                                  <Badge variant="destructive">Emergency</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-2">
                                Fix by: {format(new Date(complaint.fixTillDate), 'PPP')}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Your Active Volunteers</CardTitle>
                  <CardDescription>Problems you're currently working on</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complaints.filter((c) => c.volunteerId === user.id && c.status !== 'resolved').length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        You haven't volunteered for any complaints yet.
                      </p>
                    ) : (
                      complaints
                        .filter((c) => c.volunteerId === user.id && c.status !== 'resolved')
                        .map((complaint) => (
                          <div
                            key={complaint.id}
                            className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {complaint.raisedByProfilePic && (
                              <Avatar className="cursor-pointer" onClick={() => openChat(complaint)}>
                                <AvatarImage src={complaint.raisedByProfilePic} />
                                <AvatarFallback>{complaint.raisedByName[0]}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openChat(complaint)}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Chat
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleResolveComplaint(complaint)}
                                  >
                                    Mark Resolved
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500">
                                By {complaint.raisedByName} • {complaint.raisedByBranch}
                              </p>
                              <p className="text-gray-600 mt-2">{complaint.description}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">{complaint.category}</Badge>
                                <Badge variant="outline">
                                  {complaint.difficulty} ({getPointsForDifficulty(complaint.difficulty)} points)
                                </Badge>
                                {complaint.emergency && (
                                  <Badge variant="destructive">Emergency</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
                <p className="text-gray-600 mt-1">Top students who helped the most</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span>Top Contributors</span>
                  </CardTitle>
                  <CardDescription>Students ranked by points earned</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getLeaderboardData().map((student, index) => (
                      <div
                        key={student.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg ${
                          student.id === user.id ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex-shrink-0 w-8 text-center">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          {index > 2 && (
                            <span className="text-lg font-semibold text-gray-600">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <Avatar>
                          <AvatarImage src={student.profilePicture} />
                          <AvatarFallback>{student.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {student.name}
                            {student.id === user.id && (
                              <Badge className="ml-2" variant="outline">You</Badge>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{student.branch}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="flex items-center space-x-1">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="text-lg font-bold text-gray-900">
                              {student.points || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
        
        {/* Chat Dialog */}
        <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chat about: {selectedComplaint?.title}</DialogTitle>
              <DialogDescription>
                Discuss this complaint with {selectedComplaint?.volunteerId === user.id ? selectedComplaint?.raisedByName : selectedComplaint?.volunteerName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="h-64 border rounded-lg p-4 overflow-y-auto bg-gray-50">
                <p className="text-sm text-gray-500 text-center">
                  Chat history would appear here in a full implementation
                </p>
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FadeTransition>
  );
}