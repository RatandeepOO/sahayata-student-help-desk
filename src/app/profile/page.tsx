'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FadeTransition from '@/components/FadeTransition';
import Navbar from '@/components/Navbar';
import { getCurrentUser, updateUser, setCurrentUser } from '@/lib/storage';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { generateAvatar } from '@/lib/avatar';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [profilePicture, setProfilePicture] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    setUser(currentUser);
    setName(currentUser.name);
    setEmail(currentUser.email);
    setPhoneNumber(currentUser.phoneNumber || '');
    setBranch(currentUser.branch || '');
    setGender(currentUser.gender || 'male');
    setProfilePicture(currentUser.profilePicture || '');
  }, [router]);

  const handleSave = () => {
    if (!user) return;

    const updates: Partial<User> = {
      name,
      email,
      phoneNumber,
      branch,
      gender,
      profilePicture,
    };

    updateUser(user.id, updates);
    const updatedUser = { ...user, ...updates };
    setCurrentUser(updatedUser);
    setUser(updatedUser);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleGenerateAvatar = () => {
    const newAvatar = generateAvatar(gender, email);
    setProfilePicture(newAvatar);
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
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account information</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profilePicture} />
                  <AvatarFallback className="text-2xl">{name[0]}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label>Profile Picture URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={profilePicture}
                      onChange={(e) => setProfilePicture(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-64"
                    />
                    <Button type="button" variant="outline" onClick={handleGenerateAvatar}>
                      Generate Avatar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                {user.role === 'student' && (
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    />
                  </div>
                )}

                {user.role === 'technical' && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={user.department || ''}
                      disabled
                    />
                  </div>
                )}
              </div>

              {user.role === 'student' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      value={user.rollNumber || ''}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={(v) => setGender(v as 'male' | 'female' | 'other')}>
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
                </div>
              )}

              {user.role === 'student' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Input
                      id="semester"
                      value={user.semester || ''}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      value={user.year || ''}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">Points Earned</Label>
                    <Input
                      id="points"
                      value={user.points || 0}
                      disabled
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">Profile updated successfully!</p>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSave} className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </FadeTransition>
  );
}
