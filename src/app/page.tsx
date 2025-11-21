'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  MessageSquare, 
  Trophy, 
  Users, 
  Bell, 
  Settings, 
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react';
import Image from 'next/image';

const TypeWriter = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <span className="font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

const ParticleEffect = ({ trigger }: { trigger: boolean }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      }));
      setParticles(newParticles);
      
      setTimeout(() => setParticles([]), 1500);
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ x: particle.x, y: particle.y, opacity: 1, scale: 1 }}
          animate={{ 
            x: particle.x + (Math.random() - 0.5) * 200,
            y: particle.y + Math.random() * 200,
            opacity: 0,
            scale: 0
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute w-2 h-2 bg-blue-500 rounded-full"
        />
      ))}
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, delay }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
    >
      <Card className="p-6 hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-2 bg-white/80 backdrop-blur border-2 hover:border-blue-400 group">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Icon className="w-12 h-12 mb-4 text-blue-600 group-hover:text-green-600 transition-colors duration-500" />
        </motion.div>
        <motion.h3 
          className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors duration-500"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {title}
        </motion.h3>
        <motion.p 
          className="text-gray-600 group-hover:text-gray-800 transition-colors duration-500"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {description}
        </motion.p>
      </Card>
    </motion.div>
  );
};

export default function Home() {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  const [triggerParticles, setTriggerParticles] = useState(false);
  const { scrollY } = useScroll();
  const heroRef = useRef(null);

  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 400], [1, 0.9]);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'technical') {
        router.push('/technical/dashboard');
      } else {
        router.push('/dashboard');
      }
    } else {
      setTimeout(() => setShowContent(true), 100);
    }
  }, [router]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 100 && scrollPosition % 300 < 50) {
        setTriggerParticles(true);
        setTimeout(() => setTriggerParticles(false), 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: MessageSquare,
      title: 'Raise Complaints',
      description: 'Easily report and track issues across campus facilities and services',
    },
    {
      icon: Users,
      title: 'Volunteer System',
      description: 'Help resolve issues and earn points for your contributions',
    },
    {
      icon: Trophy,
      title: 'Leaderboard',
      description: 'Compete with peers and showcase your problem-solving skills',
    },
    {
      icon: Bell,
      title: 'Real-time Notifications',
      description: 'Stay updated on complaint status and important announcements',
    },
    {
      icon: Shield,
      title: 'Admin Dashboard',
      description: 'Comprehensive management tools for administrators',
    },
    {
      icon: Zap,
      title: 'Quick Resolution',
      description: 'Fast-track urgent issues with priority handling system',
    },
    {
      icon: CheckCircle,
      title: 'Track Progress',
      description: 'Monitor complaint resolution with detailed analytics',
    },
    {
      icon: Settings,
      title: 'Technical Team Portal',
      description: 'Dedicated interface for technical staff to manage assignments',
    },
  ];

  if (!showContent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <ParticleEffect trigger={triggerParticles} />
      
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity, scale }}
        className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 35,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-green-200 rounded-full opacity-20 blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="text-center z-10"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: 'spring', stiffness: 150, damping: 20 }}
            className="flex items-center justify-center mb-8"
          >
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/favicon-1762096162206.ico"
              alt="Sahayata Logo"
              width={120}
              height={120}
              className="rounded-full shadow-2xl"
            />
          </motion.div>

          {/* Title with Typing Effect */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeInOut' }}
            className="text-5xl md:text-7xl font-bold mb-4 text-gray-800"
          >
            Getting started with
          </motion.h1>
          <h1 className="text-6xl md:text-8xl mb-8">
            <TypeWriter text="SAHAYATA" />
          </h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5, ease: 'easeInOut' }}
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto"
          >
            Your Campus Help Desk Solution - Report Issues, Volunteer, and Make a Difference
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Button
                size="lg"
                onClick={() => router.push('/auth')}
                className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 shadow-xl hover:shadow-2xl transition-all duration-500"
              >
                Login
              </Button>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/info')}
                className="text-lg px-8 py-6 border-2 border-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-500"
              >
                Info Page
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.5, ease: 'easeInOut' }}
          className="absolute bottom-8"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-gray-400 flex flex-col items-center"
          >
            <span className="text-sm mb-2">Scroll to explore</span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="max-w-7xl mx-auto"
        >
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800"
          >
            Why Choose Sahayata?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto"
          >
            A comprehensive platform designed to streamline campus issue management and foster community collaboration
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        className="py-12 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <motion.div
          initial={{ y: 50 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-7xl mx-auto text-center relative z-10"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mb-4"
          >
            <p className="text-lg font-semibold mb-2">Licensed by</p>
            <h3 className="text-2xl md:text-3xl font-bold">Ratandeep Arora and Team</h3>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
            className="text-sm opacity-90 mt-4"
          >
            © {new Date().getFullYear()} Sahayata. All rights reserved.
          </motion.p>
        </motion.div>
      </motion.footer>
    </div>
  );
}