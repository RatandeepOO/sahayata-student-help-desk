'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { saveUser, setCurrentUser, getUsers, isAdminCredential, getAdminDepartment, saveTechnicalMember } from '@/lib/storage';
import { generateAvatar } from '@/lib/avatar';
import { User, TechnicalTeamMember } from '@/lib/types';
import Image from 'next/image';

export default function AuthPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [userType, setUserType] = useState<'student' | 'technical'>('student');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state - Student
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [branch, setBranch] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [dob, setDob] = useState<Date>();
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Signup state - Technical
  const [techName, setTechName] = useState('');
  const [techEmail, setTechEmail] = useState('');
  const [techPassword, setTechPassword] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [department, setDepartment] = useState('');
  
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check admin credentials
    if (isAdminCredential(loginEmail, loginPassword)) {
      const adminUser: User = {
        id: 'admin-' + Date.now(),
        email: loginEmail,
        password: loginPassword,
        role: 'admin',
        name: 'Admin',
        branch: getAdminDepartment(loginEmail),
        points: 0,
      };
      setCurrentUser(adminUser);
      router.push('/admin/dashboard');
      return;
    }
    
    // Check regular users
    const users = getUsers();
    const user = users.find((u) => u.email === loginEmail && u.password === loginPassword);
    
    if (user) {
      setCurrentUser(user);
      if (user.role === 'student') {
        router.push('/dashboard');
      } else if (user.role === 'technical') {
        router.push('/technical/dashboard');
      }
    } else {
      setError('Invalid email or password');
    }
  };

  const handleSignupStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!studentName || !studentEmail || !studentPassword || !branch || !rollNumber) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Check if user exists
    const users = getUsers();
    if (users.some((u) => u.email === studentEmail)) {
      setError('Email already registered');
      return;
    }
    
    const newUser: User = {
      id: 'student-' + Date.now(),
      email: studentEmail,
      password: studentPassword,
      role: 'student',
      name: studentName,
      branch,
      rollNumber,
      semester,
      year,
      gender,
      dob: dob ? format(dob, 'yyyy-MM-dd') : undefined,
      profilePicture: generateAvatar(gender, studentEmail),
      phoneNumber,
      points: 0,
    };
    
    saveUser(newUser);
    setCurrentUser(newUser);
    router.push('/dashboard');
  };

  const handleSignupTechnical = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!techName || !techEmail || !techPassword || !techPhone || !department) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Check if user exists
    const users = getUsers();
    if (users.some((u) => u.email === techEmail)) {
      setError('Email already registered');
      return;
    }
    
    const newUser: User = {
      id: 'tech-' + Date.now(),
      email: techEmail,
      password: techPassword,
      role: 'technical',
      name: techName,
      department,
      phoneNumber: techPhone,
      profilePicture: generateAvatar('male', techEmail),
      points: 0,
    };
    
    saveUser(newUser);
    
    // Also add to technical team list
    const techMember: TechnicalTeamMember = {
      id: newUser.id,
      name: techName,
      department,
      email: techEmail,
      phoneNumber: techPhone,
      available: true,
    };
    saveTechnicalMember(techMember);
    
    setCurrentUser(newUser);
    router.push('/technical/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/favicon-1762096162206.ico"
              alt="Sahayata Logo"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Sahayata</h1>
          <p className="text-gray-600 mt-2">College Help Desk System</p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@college.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full">Login</Button>
              </form>
            ) : (
              <Tabs value={userType} onValueChange={(v) => setUserType(v as 'student' | 'technical')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="student">Student</TabsTrigger>
                  <TabsTrigger value="technical">Technical Team</TabsTrigger>
                </TabsList>
                
                <TabsContent value="student">
                  <form onSubmit={handleSignupStudent} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentName">Name *</Label>
                        <Input
                          id="studentName"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentEmail">Email *</Label>
                        <Input
                          id="studentEmail"
                          type="email"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentPassword">Password *</Label>
                        <Input
                          id="studentPassword"
                          type="password"
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="branch">Branch *</Label>
                        <Input
                          id="branch"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="e.g., Computer Science"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rollNumber">Roll Number *</Label>
                        <Input
                          id="rollNumber"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select value={semester} onValueChange={setSemester}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                              <SelectItem key={sem} value={sem.toString()}>{sem}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Select value={year} onValueChange={setYear}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1st">1st Year</SelectItem>
                            <SelectItem value="2nd">2nd Year</SelectItem>
                            <SelectItem value="3rd">3rd Year</SelectItem>
                            <SelectItem value="4th">4th Year</SelectItem>
                          </SelectContent>
                        </Select>
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
                    
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dob && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dob}
                            onSelect={setDob}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <Button type="submit" className="w-full">Sign Up as Student</Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="technical">
                  <form onSubmit={handleSignupTechnical} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="techName">Name *</Label>
                      <Input
                        id="techName"
                        value={techName}
                        onChange={(e) => setTechName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="techEmail">Email *</Label>
                      <Input
                        id="techEmail"
                        type="email"
                        value={techEmail}
                        onChange={(e) => setTechEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="techPassword">Password *</Label>
                      <Input
                        id="techPassword"
                        type="password"
                        value={techPassword}
                        onChange={(e) => setTechPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="techPhone">Mobile Number *</Label>
                      <Input
                        id="techPhone"
                        type="tel"
                        value={techPhone}
                        onChange={(e) => setTechPhone(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
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
                    
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <Button type="submit" className="w-full">Sign Up as Technical Team</Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}