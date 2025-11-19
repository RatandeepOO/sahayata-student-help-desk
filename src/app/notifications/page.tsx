'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FadeTransition from '@/components/FadeTransition';
import Navbar from '@/components/Navbar';
import { getCurrentUser, getNotifications, markNotificationAsRead } from '@/lib/storage';
import { User, Notification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    setUser(currentUser);
    loadNotifications(currentUser.id);
  }, [router]);

  const loadNotifications = (userId: string) => {
    const allNotifications = getNotifications()
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setNotifications(allNotifications);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    if (user) {
      loadNotifications(user.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'complaint_resolved':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'new_message':
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case 'complaint_accepted':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  if (!user) return null;

  return (
    <FadeTransition>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href={user.role === 'student' ? '/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/technical/dashboard'}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">Stay updated with your activity</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                {notifications.filter((n) => !n.read).length} unread notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${
                        notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </FadeTransition>
  );
}
