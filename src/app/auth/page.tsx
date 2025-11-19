'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateAvatar } from '@/lib/avatar';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { toast } from 'sonner';

const ADMIN_CREDENTIALS = [
  { email: 'cse@sahayata.com', password: 'CSEADMIN', department: 'CSE' },
  { email: 'elex@sahayata.com', password: 'ELEXADMIN', department: 'Electronics' },
  { email: 'pharma@sahayata.com', password: 'PHARMAADMIN', department: 'Pharmacy' },
  { email: 'mech@sahayata.com', password: 'MECHADMIN', department: 'Mechanical' },
  { email: 'elec@sahayata.com', password: 'ELECADMIN', department: 'Electrical' },
];

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [userType, setUserType] = useState<'student' | 'technical'>('student');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Check if admin credentials
      const adminCred = ADMIN_CREDENTIALS.find(
        (cred) => cred.email === loginEmail && cred.password === loginPassword
      );
      
      if (adminCred) {
        // Admin login - create session without Supabase auth
        const { data: adminUser, error: adminFetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', loginEmail)
          .eq('role', 'admin')
          .single();

        if (adminFetchError || !adminUser) {
          // Create admin user if doesn't exist
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: loginEmail,
            password: loginPassword,
            options: {
              data: {
                role: 'admin',
                name: 'Admin',
              },
            },
          });

          if (authError) throw authError;

          if (authData.user) {
            const { error: insertError } = await supabase.from('users').insert({
              auth_user_id: authData.user.id,
              email: loginEmail,
              role: 'admin',
              name: 'Admin',
              branch: adminCred.department,
              points: 0,
            });

            if (insertError) throw insertError;
          }
        }

        // Sign in admin
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });

        if (signInError) throw signInError;

        toast.success('Admin login successful!');
        router.push('/admin/dashboard');
        return;
      }
      
      // Regular user login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      
      if (signInError) {
        toast.error('Invalid email or password');
        return;
      }
      
      // Get user data
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        toast.error('Login failed');
        return;
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      
      if (userError || !userData) {
        toast.error('User data not found');
        return;
      }
      
      toast.success('Login successful!');
      
      // Redirect based on role
      if (userData.role === 'student') {
        router.push('/dashboard');
      } else if (userData.role === 'technical') {
        router.push('/technical/dashboard');
      } else if (userData.role === 'admin') {
        router.push('/admin/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validation
      if (!studentName || !studentEmail || !studentPassword || !branch || !rollNumber) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: studentEmail,
        password: studentPassword,
        options: {
          data: {
            name: studentName,
            role: 'student',
          },
        },
      });
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Email already registered');
        } else {
          toast.error(authError.message);
        }
        return;
      }
      
      if (!authData.user) {
        toast.error('Signup failed');
        return;
      }
      
      // Create user profile
      const { error: insertError } = await supabase.from('users').insert({
        auth_user_id: authData.user.id,
        email: studentEmail,
        role: 'student',
        name: studentName,
        branch,
        roll_number: rollNumber,
        semester,
        year,
        gender,
        dob: dob ? format(dob, 'yyyy-MM-dd') : null,
        profile_picture: generateAvatar(gender, studentEmail),
        phone_number: phoneNumber,
        points: 0,
      });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Failed to create user profile');
        return;
      }
      
      toast.success('Student account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupTechnical = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validation
      if (!techName || !techEmail || !techPassword || !techPhone || !department) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: techEmail,
        password: techPassword,
        options: {
          data: {
            name: techName,
            role: 'technical',
          },
        },
      });
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Email already registered');
        } else {
          toast.error(authError.message);
        }
        return;
      }
      
      if (!authData.user) {
        toast.error('Signup failed');
        return;
      }
      
      // Create user profile
      const { data: userData, error: insertError } = await supabase.from('users').insert({
        auth_user_id: authData.user.id,
        email: techEmail,
        role: 'technical',
        name: techName,
        department,
        phone_number: techPhone,
        profile_picture: generateAvatar('male', techEmail),
        points: 0,
      }).select().single();
      
      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Failed to create user profile');
        return;
      }
      
      // Add to technical team table
      const { error: techError } = await supabase.from('technical_team').insert({
        id: userData.id,
        name: techName,
        department,
        email: techEmail,
        phone_number: techPhone,
        available: true,
      });
      
      if (techError) {
        console.error('Technical team insert error:', techError);
      }
      
      toast.success('Technical team account created successfully!');
      router.push('/technical/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
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
                          disabled={isLoading}
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
                          disabled={isLoading}
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
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={isLoading}
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
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rollNumber">Roll Number *</Label>
                        <Input
                          id="rollNumber"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select value={semester} onValueChange={setSemester} disabled={isLoading}>
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
                        <Select value={year} onValueChange={setYear} disabled={isLoading}>
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
                        <Select value={gender} onValueChange={(v) => setGender(v as 'male' | 'female' | 'other')} disabled={isLoading}>
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
                            disabled={isLoading}
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
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Sign Up as Student'}
                    </Button>
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select value={department} onValueChange={setDepartment} disabled={isLoading}>
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
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Sign Up as Technical Team'}
                    </Button>
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