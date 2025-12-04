'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FadeTransition from '@/components/FadeTransition';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/storage';
import { User, Complaint } from '@/lib/types';
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
import { CalendarIcon, Plus, AlertCircle, CheckCircle2, Clock, FileText, MessageSquare, Trophy, Send, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getPointsForDifficulty } from '@/lib/avatar';
import { toast } from 'sonner';
import Image from 'next/image';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<User[]>([]);
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [emergency, setEmergency] = useState(false);
  const [fixTillDate, setFixTillDate] = useState<Date>();
  const [photo, setPhoto] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Chat state
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Image preview dialog
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
      router.push('/auth');
      return;
    }
    setUser(currentUser);
    loadData(currentUser.id);
  }, [router]);

  const loadData = async (userId: string | number) => {
    setLoading(true);
    try {
      // Load all complaints
      const complaintsRes = await fetch('/api/complaints?limit=100');
      if (complaintsRes.ok) {
        const complaintsData = await complaintsRes.json();
        setComplaints(complaintsData);
        // Filter user's complaints
        setUserComplaints(complaintsData.filter((c: Complaint) => c.raisedBy === userId));
      }

      // Load leaderboard
      const leaderboardRes = await fetch('/api/users?role=student&limit=100');
      if (leaderboardRes.ok) {
        const leaderboardUsers = await leaderboardRes.json();
        setLeaderboardData(leaderboardUsers.sort((a: User, b: User) => (b.points || 0) - (a.points || 0)).slice(0, 20));
      }

      // Refresh user data to get latest points
      const userRes = await fetch(`/api/users?id=${userId}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPhoto(data.url);
        toast.success('Image uploaded successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('User not found');
      return;
    }

    // Validate all required fields
    if (!title || title.trim().length === 0) {
      toast.error('Please enter a title');
      return;
    }

    if (!description || description.trim().length === 0) {
      toast.error('Please enter a description');
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    if (!difficulty) {
      toast.error('Please select a difficulty level');
      return;
    }

    if (!fixTillDate) {
      toast.error('Please select a fix till date');
      return;
    }

    if (submittingComplaint) {
      return;
    }

    // Convert user ID to number and validate
    const userIdNum = typeof user.id === 'number' ? user.id : parseInt(String(user.id));
    
    if (isNaN(userIdNum)) {
      toast.error('Invalid user ID. Please log in again.');
      return;
    }

    setSubmittingComplaint(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        emergency,
        fixTillDate: format(fixTillDate, 'yyyy-MM-dd'),
        photo: photo.trim() || undefined,
        raisedBy: userIdNum,
        raisedByName: user.name,
        raisedByBranch: user.branch,
        raisedByProfilePic: user.profilePicture,
      };

      console.log('Submitting complaint with payload:', payload);

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Complaint submitted successfully');
        // Reset form
        setTitle('');
        setDescription('');
        setCategory('');
        setDifficulty('');
        setEmergency(false);
        setFixTillDate(undefined);
        setPhoto('');
        setDialogOpen(false);
        loadData(userIdNum);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleVolunteer = async (complaint: Complaint) => {
    if (!user) return;
    
    try {
      const res = await fetch(`/api/complaints?id=${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in-progress',
          volunteerId: user.id,
          volunteerName: user.name,
        }),
      });

      if (res.ok) {
        // Send notification to complaint raiser
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: complaint.raisedBy,
            type: 'complaint_accepted',
            message: `${user.name} has volunteered to help with your complaint: "${complaint.title}"`,
            complaintId: complaint.id,
          }),
        });

        toast.success('You are now volunteering for this complaint');
        loadData(user.id);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to volunteer');
      }
    } catch (error) {
      console.error('Error volunteering:', error);
      toast.error('Failed to volunteer');
    }
  };
  
  const handleResolveComplaint = async (complaint: Complaint) => {
    if (!user || complaint.volunteerId !== user.id) return;
    
    try {
      // Update complaint status
      const complaintRes = await fetch(`/api/complaints?id=${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
        }),
      });

      if (!complaintRes.ok) {
        throw new Error('Failed to update complaint');
      }

      // Award points
      const points = getPointsForDifficulty(complaint.difficulty);
      const currentPoints = user.points || 0;
      const newPoints = currentPoints + points;

      const userRes = await fetch(`/api/users?id=${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: newPoints }),
      });

      if (userRes.ok) {
        const updatedUser = await userRes.json();
        setUser(updatedUser);
      }

      // Send notification
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: complaint.raisedBy,
          type: 'complaint_resolved',
          message: `Your complaint "${complaint.title}" has been resolved by ${user.name}!`,
          complaintId: complaint.id,
        }),
      });

      toast.success(`Complaint resolved! You earned ${points} points!`);
      loadData(user.id);
    } catch (error) {
      console.error('Error resolving complaint:', error);
      toast.error('Failed to resolve complaint');
    }
  };

  const openChat = (complaint: Complaint) => {
    if (!user) return;
    
    const receiverId = complaint.volunteerId === user.id 
      ? complaint.raisedBy 
      : complaint.volunteerId;
    
    if (!receiverId) {
      toast.error('No recipient found');
      return;
    }

    // Redirect to messages page with userId and default message
    router.push(`/messages?userId=${receiverId}&defaultMessage=${encodeURIComponent(`Hello, I am ${user.name}`)}`);
  };

  const openImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setImagePreviewOpen(true);
  };

  const getChartData = () => {
    const open = userComplaints.filter((c) => c.status === 'open').length;
    const inProgress = userComplaints.filter((c) => c.status === 'in-progress').length;
    const resolved = userComplaints.filter((c) => c.status === 'resolved').length;

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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            </div>
          ) : (
            <>
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
                            <Label htmlFor="photo">Photo (Optional)</Label>
                            <div className="flex flex-col space-y-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="w-full"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                              </Button>
                              {photo && (
                                <div className="relative w-full h-40 border rounded-lg overflow-hidden">
                                  <Image
                                    src={photo}
                                    alt="Complaint photo"
                                    fill
                                    className="object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() => setPhoto('')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
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
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submittingComplaint}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={submittingComplaint}>
                              {submittingComplaint ? 'Submitting...' : 'Submit Complaint'}
                            </Button>
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
                          userComplaints
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((complaint) => (
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
                                {complaint.photo && (
                                  <div className="mt-2">
                                    <button
                                      onClick={() => openImagePreview(complaint.photo!)}
                                      className="relative w-32 h-32 border rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                                    >
                                      <Image
                                        src={complaint.photo}
                                        alt="Complaint photo"
                                        fill
                                        className="object-cover"
                                      />
                                    </button>
                                  </div>
                                )}
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
                                  {complaint.photo && (
                                    <div className="mt-2">
                                      <button
                                        onClick={() => openImagePreview(complaint.photo!)}
                                        className="relative w-32 h-32 border rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                                      >
                                        <Image
                                          src={complaint.photo}
                                          alt="Complaint photo"
                                          fill
                                          className="object-cover"
                                        />
                                      </button>
                                    </div>
                                  )}
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
                                  {complaint.photo && (
                                    <div className="mt-2">
                                      <button
                                        onClick={() => openImagePreview(complaint.photo!)}
                                        className="relative w-32 h-32 border rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                                      >
                                        <Image
                                          src={complaint.photo}
                                          alt="Complaint photo"
                                          fill
                                          className="object-cover"
                                        />
                                      </button>
                                    </div>
                                  )}
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
                        {leaderboardData.map((student, index) => (
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
            </>
          )}
        </main>
        
        {/* Image Preview Dialog */}
        <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[70vh]">
              {previewImageUrl && (
                <Image
                  src={previewImageUrl}
                  alt="Complaint image"
                  fill
                  className="object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FadeTransition>
  );
}