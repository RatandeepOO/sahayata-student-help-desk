'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, User, LogOut, Menu, Home, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getCurrentUser, logout, getNotifications } from '@/lib/storage';
import { User as UserType } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: { id: string; label: string }[];
}

export default function Navbar({ activeTab, onTabChange, tabs = [] }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Count unread notifications
    if (currentUser) {
      const notifications = getNotifications().filter(
        (n) => n.userId === currentUser.id && !n.read
      );
      setUnreadCount(notifications.length);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleHome = () => {
    router.push('/');
  };

  const handleMessages = () => {
    router.push('/messages');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Now Clickable */}
          <button 
            onClick={handleHome}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/favicon-1762096162206.ico"
              alt="Sahayata"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-xl font-bold text-gray-900">Sahayata</span>
          </button>

          {/* Desktop Navigation */}
          {tabs.length > 0 && (
            <div className="hidden md:flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Home Button - Visible on mobile */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleHome}
              className="md:hidden"
              title="Go to Home"
            >
              <Home className="h-5 w-5" />
            </Button>

            {/* Messages Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleMessages}
              title="Messages"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Link href="/notifications" className="relative">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  {user?.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="hidden md:block">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleHome}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMessages}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleProfile}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            {tabs.length > 0 && (
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col space-y-2 mt-8">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => onTabChange?.(tab.id)}
                        className={`px-4 py-3 rounded-lg font-medium text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}