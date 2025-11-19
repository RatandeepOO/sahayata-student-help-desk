'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FadeTransition from '@/components/FadeTransition';
import Navbar from '@/components/Navbar';
import { getCurrentUser, getComplaints, updateComplaint, saveNotification, updateUser } from '@/lib/storage';
import { User, Complaint } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { getPointsForDifficulty } from '@/lib/avatar';

export default function TechnicalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'technical') {
      router.push('/auth');
      return;
    }
    setUser(currentUser);
    loadComplaints(currentUser);
  }, [router]);

  const loadComplaints = (currentUser: User) => {
    const allComplaints = getComplaints();
    
    // Filter complaints by department
    const departmentComplaints = allComplaints.filter(
      (c) => c.category === currentUser.department?.toLowerCase() || c.category === 'other'
    );
    
    setComplaints(departmentComplaints);
    setMyComplaints(allComplaints.filter((c) => c.volunteerId === currentUser.id));
  };

  const handleAccept = (complaint: Complaint) => {
    if (!user) return;

    updateComplaint(complaint.id, {
      status: 'in-progress',
      volunteerId: user.id,
      volunteerName: user.name,
    });

    saveNotification({
      id: 'notif-' + Date.now(),
      userId: complaint.raisedBy,
      type: 'complaint_accepted',
      message: `${user.name} from ${user.department} team has accepted your complaint: "${complaint.title}"`,
      complaintId: complaint.id,
      read: false,
      timestamp: new Date().toISOString(),
    });

    loadComplaints(user);
  };

  const handleTransfer = (complaint: Complaint) => {
    if (!user) return;

    // Simply reset the volunteer, making it available for others
    updateComplaint(complaint.id, {
      status: 'open',
      volunteerId: undefined,
      volunteerName: undefined,
    });

    saveNotification({
      id: 'notif-' + Date.now(),
      userId: complaint.raisedBy,
      type: 'complaint_accepted',
      message: `Your complaint "${complaint.title}" has been transferred and is now available for other team members.`,
      complaintId: complaint.id,
      read: false,
      timestamp: new Date().toISOString(),
    });

    loadComplaints(user);
  };

  const handleResolve = (complaint: Complaint) => {
    if (!user || complaint.volunteerId !== user.id) return;

    updateComplaint(complaint.id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });

    // Award points to technical team member
    const points = getPointsForDifficulty(complaint.difficulty);
    const currentPoints = user.points || 0;
    updateUser(user.id, { points: currentPoints + points });
    setUser({ ...user, points: currentPoints + points });

    saveNotification({
      id: 'notif-' + Date.now(),
      userId: complaint.raisedBy,
      type: 'complaint_resolved',
      message: `Your complaint "${complaint.title}" has been resolved by ${user.name} from ${user.department} team!`,
      complaintId: complaint.id,
      read: false,
      timestamp: new Date().toISOString(),
    });

    loadComplaints(user);
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
                                <Button size="sm" onClick={() => handleAccept(complaint)}>
                                  Accept
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
        </main>
      </div>
    </FadeTransition>
  );
}
