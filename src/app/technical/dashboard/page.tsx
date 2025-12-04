'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FadeTransition from '@/components/FadeTransition';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/storage';
import { User, Complaint } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Clock, ArrowRight, MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { getPointsForDifficulty } from '@/lib/avatar';
import { toast } from 'sonner';
import Image from 'next/image';

export default function TechnicalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Image preview dialog
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'technical') {
      router.push('/auth');
      return;
    }
    setUser(currentUser);
    loadComplaints(currentUser);
  }, [router]);

  const loadComplaints = async (currentUser: User) => {
    setLoading(true);
    try {
      // Load all complaints from API
      const complaintsRes = await fetch('/api/complaints?limit=100');
      if (complaintsRes.ok) {
        const allComplaints = await complaintsRes.json();
        
        // Filter complaints by department
        const departmentComplaints = allComplaints.filter(
          (c: Complaint) => c.category === currentUser.department?.toLowerCase() || c.category === 'other'
        );
        
        setComplaints(departmentComplaints);
        setMyComplaints(allComplaints.filter((c: Complaint) => c.volunteerId === currentUser.id));
      } else {
        toast.error('Failed to load complaints');
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (complaint: Complaint) => {
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
            message: `${user.name} from ${user.department} team has accepted your complaint: "${complaint.title}"`,
            complaintId: complaint.id,
          }),
        });

        toast.success('Complaint accepted successfully');
        loadComplaints(user);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to accept complaint');
      }
    } catch (error) {
      console.error('Error accepting complaint:', error);
      toast.error('Failed to accept complaint');
    }
  };

  const handleTransfer = async (complaint: Complaint) => {
    if (!user) return;

    try {
      const res = await fetch(`/api/complaints?id=${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'open',
          volunteerId: null,
          volunteerName: null,
        }),
      });

      if (res.ok) {
        // Send notification
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: complaint.raisedBy,
            type: 'complaint_accepted',
            message: `Your complaint "${complaint.title}" has been transferred and is now available for other team members.`,
            complaintId: complaint.id,
          }),
        });

        toast.success('Complaint transferred successfully');
        loadComplaints(user);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to transfer complaint');
      }
    } catch (error) {
      console.error('Error transferring complaint:', error);
      toast.error('Failed to transfer complaint');
    }
  };

  const handleResolve = async (complaint: Complaint) => {
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
          message: `Your complaint "${complaint.title}" has been resolved by ${user.name} from ${user.department} team!`,
          complaintId: complaint.id,
        }),
      });

      toast.success(`Complaint resolved! You earned ${points} points!`);
      loadComplaints(user);
    } catch (error) {
      console.error('Error resolving complaint:', error);
      toast.error('Failed to resolve complaint');
    }
  };

  const openChat = (complaint: Complaint) => {
    if (!user) return;
    
    // Redirect to messages page with userId and default message
    router.push(`/messages?userId=${complaint.raisedBy}&defaultMessage=${encodeURIComponent(`Hello, I am ${user.name}`)}`);
  };

  const openImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setImagePreviewOpen(true);
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

  if (!user) return null;

  return (
    <FadeTransition>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Technical Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  {user.department} Department • Manage your assigned complaints
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Available Complaints</CardDescription>
                    <CardTitle className="text-3xl">
                      {complaints.filter((c) => c.status === 'open').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Your Active Tasks</CardDescription>
                    <CardTitle className="text-3xl text-blue-600">
                      {myComplaints.filter((c) => c.status === 'in-progress').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Resolved by You</CardDescription>
                    <CardTitle className="text-3xl text-green-600">
                      {myComplaints.filter((c) => c.status === 'resolved').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Open Complaints for Department */}
              <Card>
                <CardHeader>
                  <CardTitle>Open Complaints - {user.department}</CardTitle>
                  <CardDescription>
                    Complaints assigned to your department (sorted by emergency and deadline)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complaints.filter((c) => c.status === 'open').length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No open complaints for your department at the moment.
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
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openChat(complaint)}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" onClick={() => handleAccept(complaint)}>
                                    Accept
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

              {/* My Active Complaints */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Active Tasks</CardTitle>
                  <CardDescription>Complaints you're currently working on</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myComplaints.filter((c) => c.status === 'in-progress').length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        You don't have any active tasks. Accept complaints from the section above.
                      </p>
                    ) : (
                      myComplaints
                        .filter((c) => c.status === 'in-progress')
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
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openChat(complaint)}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleTransfer(complaint)}
                                  >
                                    <ArrowRight className="h-4 w-4 mr-1" />
                                    Transfer
                                  </Button>
                                  <Button size="sm" onClick={() => handleResolve(complaint)}>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
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

              {/* Resolved Complaints */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Resolved Complaints</CardTitle>
                  <CardDescription>Complaints you've successfully resolved</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myComplaints.filter((c) => c.status === 'resolved').length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No resolved complaints yet.
                      </p>
                    ) : (
                      myComplaints
                        .filter((c) => c.status === 'resolved')
                        .slice(0, 5)
                        .map((complaint) => (
                          <div
                            key={complaint.id}
                            className="flex items-start space-x-4 p-4 border rounded-lg bg-green-50"
                          >
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                              <p className="text-sm text-gray-500">
                                By {complaint.raisedByName} • {complaint.raisedByBranch}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">{complaint.category}</Badge>
                                <Badge variant="outline">
                                  Earned: {getPointsForDifficulty(complaint.difficulty)} points
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Resolved: {complaint.resolvedAt && format(new Date(complaint.resolvedAt), 'PPP')}
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