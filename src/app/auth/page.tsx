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
  const [dobInput, setDobInput] = useState('');
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
      console.log('Attempting login with:', loginEmail);
      
      // Check if admin credentials
      const adminCred = ADMIN_CREDENTIALS.find(
        (cred) => cred.email === loginEmail && cred.password === loginPassword
      );
      
      if (adminCred) {
        console.log('Admin login detected');
        // Admin login - check if admin exists
        const { data: adminUser, error: adminFetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', loginEmail)
          .eq('role', 'admin')
          .single();

        if (adminFetchError || !adminUser) {
          console.log('Admin user not found, creating...');
          // Create admin user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: loginEmail,
            password: loginPassword,
            options: {
              emailRedirectTo: undefined,
              data: {
                role: 'admin',
                name: 'Admin',
              },
            },
          });

          console.log('Admin auth signup result:', { authData, authError });

          if (authError) {
            console.error('Admin auth error:', authError);
            toast.error(`Admin signup failed: ${authError.message}`);
            setIsLoading(false);
            return;
          }

          if (authData.user) {
            const { error: insertError } = await supabase.from('users').insert({
              auth_user_id: authData.user.id,
              email: loginEmail,
              role: 'admin',
              name: 'Admin',
              branch: adminCred.department,
              points: 0,
            });

            console.log('Admin user insert result:', insertError);

            if (insertError) {
              console.error('Admin insert error:', insertError);
              toast.error(`Failed to create admin profile: ${insertError.message}`);
              setIsLoading(false);
              return;
            }
          }
        }

        // Sign in admin
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });

        console.log('Admin sign in result:', { signInData, signInError });

        if (signInError) {
          console.error('Admin sign in error:', signInError);
          toast.error(`Admin login failed: ${signInError.message}`);
          setIsLoading(false);
          return;
        }

        toast.success('Admin login successful!');
        router.push('/admin/dashboard');
        return;
      }
      
      // Regular user login
      console.log('Regular user login');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      
      console.log('Sign in result:', { signInData, signInError });
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        toast.error(`Login failed: ${signInError.message}`);
        setIsLoading(false);
        return;
      }
      
      // Get user data
      const { data: { user: authUser }, error: getUserError } = await supabase.auth.getUser();
      
      console.log('Get user result:', { authUser, getUserError });
      
      if (!authUser) {
        toast.error('Login failed: User not found');
        setIsLoading(false);
        return;
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      
      console.log('User data query result:', { userData, userError });
      
      if (userError || !userData) {
        console.error('User data error:', userError);
        toast.error('User profile not found. Please contact support.');
        setIsLoading(false);
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

  const handleDobChange = (value: string) => {
    // Only allow numbers and /
    const cleaned = value.replace(/[^\d/]/g, '');
    
    // Auto-format as user types
    let formatted = cleaned;
    if (cleaned.length >= 2 && cleaned[2] !== '/') {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 5 && cleaned[5] !== '/') {
      const parts = formatted.split('/');
      if (parts.length === 2) {
        formatted = parts[0] + '/' + parts[1].slice(0, 2) + '/' + parts[1].slice(2);
      }
    }
    
    // Limit to dd/mm/yy format (8 chars including slashes)
    if (formatted.length <= 8) {
      setDobInput(formatted);
      
      // Try to parse the date if format is complete
      if (formatted.length === 8) {
        const parts = formatted.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
          let year = parseInt(parts[2], 10);
          
          // Convert 2-digit year to 4-digit (assume 1900s-2000s)
          if (year < 100) {
            year += year > 50 ? 1900 : 2000;
          }
          
          const date = new Date(year, month, day);
          
          // Validate the date
          if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
            setDob(date);
          }
        }
      }
    }
  };

  const handleSignupStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('Starting student signup...');
      
      // Validation
      if (!studentName || !studentEmail || !studentPassword || !branch || !rollNumber) {
        toast.error('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      if (studentPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
      
      console.log('Creating auth user for student:', studentEmail);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: studentEmail,
        password: studentPassword,
        options: {
          emailRedirectTo: undefined,
          data: {
            name: studentName,
            role: 'student',
          },
        },
      });
      
      console.log('Auth signup result:', { authData, authError });
      
      if (authError) {
        console.error('Auth error:', authError);
        if (authError.message.includes('already registered')) {
          toast.error('Email already registered. Please login instead.');
        } else {
          toast.error(`Signup failed: ${authError.message}`);
        }
        setIsLoading(false);
        return;
      }
      
      if (!authData.user) {
        toast.error('Signup failed: No user created');
        setIsLoading(false);
        return;
      }

      console.log('Auth user created:', authData.user.id);
      
      // Create user profile
      const userProfile = {
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
      };

      console.log('Inserting user profile:', userProfile);

      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert(userProfile)
        .select();
      
      console.log('User profile insert result:', { insertData, insertError });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error(`Failed to create profile: ${insertError.message}`);
        setIsLoading(false);
        return;
      }
      
      toast.success('Student account created successfully! You can now login.');
      
      // Switch to login tab
      setAuthMode('login');
      setLoginEmail(studentEmail);
      
      // Clear signup form
      setStudentName('');
      setStudentEmail('');
      setStudentPassword('');
      setBranch('');
      setRollNumber('');
      setSemester('');
      setYear('');
      setPhoneNumber('');
      setDobInput('');
      setDob(undefined);
      
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
      console.log('Starting technical signup...');
      
      // Validation
      if (!techName || !techEmail || !techPassword || !techPhone || !department) {
        toast.error('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      if (techPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
      
      console.log('Creating auth user for technical:', techEmail);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: techEmail,
        password: techPassword,
        options: {
          emailRedirectTo: undefined,
          data: {
            name: techName,
            role: 'technical',
          },
        },
      });
      
      console.log('Auth signup result:', { authData, authError });
      
      if (authError) {
        console.error('Auth error:', authError);
        if (authError.message.includes('already registered')) {
          toast.error('Email already registered. Please login instead.');
        } else {
          toast.error(`Signup failed: ${authError.message}`);
        }
        setIsLoading(false);
        return;
      }
      
      if (!authData.user) {
        toast.error('Signup failed: No user created');
        setIsLoading(false);
        return;
      }

      console.log('Auth user created:', authData.user.id);
      
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
      
      console.log('User profile insert result:', { userData, insertError });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error(`Failed to create profile: ${insertError.message}`);
        setIsLoading(false);
        return;
      }
      
      console.log('Creating technical team entry...');
      
      // Add to technical team table
      const { error: techError } = await supabase.from('technical_team').insert({
        id: userData.id,
        name: techName,
        department,
        email: techEmail,
        phone_number: techPhone,
        available: true,
      });
      
      console.log('Technical team insert result:', techError);
      
      if (techError) {
        console.error('Technical team insert error:', techError);
      }
      
      toast.success('Technical team account created successfully! You can now login.');
      
      // Switch to login tab
      setAuthMode('login');
      setLoginEmail(techEmail);
      
      // Clear signup form
      setTechName('');
      setTechEmail('');
      setTechPassword('');
      setTechPhone('');
      setDepartment('');
      
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
                        <Label htmlFor="studentPassword">Password * (min 6 characters)</Label>
                        <Input
                          id="studentPassword"
                          type="password"
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          minLength={6}
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
                      <Label htmlFor="dob">Date of Birth (DD/MM/YY)</Label>
                      <Input
                        id="dob"
                        value={dobInput}
                        onChange={(e) => handleDobChange(e.target.value)}
                        placeholder="DD/MM/YY"
                        disabled={isLoading}
                        maxLength={8}
                      />
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
                      <Label htmlFor="techPassword">Password * (min 6 characters)</Label>
                      <Input
                        id="techPassword"
                        type="password"
                        value={techPassword}
                        onChange={(e) => setTechPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        minLength={6}
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