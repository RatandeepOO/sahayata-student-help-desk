'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const slides = [
  {
    title: 'Welcome to Sahayata',
    subtitle: 'Your Campus Help Desk Solution',
    description: 'A comprehensive platform designed to streamline issue reporting and resolution across your college campus.',
    icon: '🎓',
    color: 'from-blue-500 to-blue-700',
  },
  {
    title: 'Report Issues Easily',
    subtitle: 'Fast & Simple Complaint System',
    description: 'Submit complaints with photos, set priority levels, and track progress in real-time. Your voice matters!',
    icon: '📝',
    color: 'from-green-500 to-green-700',
  },
  {
    title: 'Volunteer & Earn Points',
    subtitle: 'Make a Difference',
    description: 'Help resolve campus issues and earn points based on difficulty. Build your reputation and climb the leaderboard!',
    icon: '🏆',
    color: 'from-purple-500 to-purple-700',
  },
  {
    title: 'Real-Time Collaboration',
    subtitle: 'Chat & Connect',
    description: 'Communicate directly with volunteers and technical team members. Stay updated with instant notifications.',
    icon: '💬',
    color: 'from-orange-500 to-orange-700',
  },
  {
    title: 'Technical Team Portal',
    subtitle: 'Professional Management',
    description: 'Dedicated dashboard for technical staff with categorized complaints and efficient assignment system.',
    icon: '⚙️',
    color: 'from-red-500 to-red-700',
  },
  {
    title: 'Admin Control Center',
    subtitle: 'Complete Oversight',
    description: 'Monitor all activities, manage users, review complaints, and ensure smooth operations across the platform.',
    icon: '🛡️',
    color: 'from-indigo-500 to-indigo-700',
  },
  {
    title: 'Ready to Get Started?',
    subtitle: 'Join Sahayata Today',
    description: 'Be part of a community that cares about making your campus a better place for everyone.',
    icon: '🚀',
    color: 'from-pink-500 to-pink-700',
  },
];

export default function InfoPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      if (currentSlide === slides.length - 1) {
        // On last slide, redirect to login after showing it
        setTimeout(() => {
          router.push('/auth');
        }, 3000);
        setAutoPlay(false);
      } else {
        setDirection(1);
        setCurrentSlide((prev) => prev + 1);
      }
    }, 2400);

    return () => clearInterval(timer);
  }, [currentSlide, autoPlay, router]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
      setAutoPlay(false);
    } else {
      router.push('/auth');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
      setAutoPlay(false);
    }
  };

  const skipToLogin = () => {
    router.push('/auth');
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <Image 
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/favicon-1762096162206.ico"
          alt="Sahayata Logo"
          width={60}
          height={60}
          className="rounded-full shadow-lg"
        />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="outline"
          onClick={skipToLogin}
          className="bg-white/90 backdrop-blur hover:bg-white"
        >
          Skip to Login
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl w-full">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
              }}
              className="text-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className={`inline-block text-8xl mb-8 p-8 rounded-full bg-gradient-to-br ${slides[currentSlide].color} shadow-2xl`}
              >
                <span className="drop-shadow-lg">{slides[currentSlide].icon}</span>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-6xl font-bold mb-4 text-gray-800"
              >
                {slides[currentSlide].title}
              </motion.h1>

              {/* Subtitle */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`text-2xl md:text-3xl font-semibold mb-6 bg-gradient-to-r ${slides[currentSlide].color} bg-clip-text text-transparent`}
              >
                {slides[currentSlide].subtitle}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
              >
                {slides[currentSlide].description}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-8 mt-16">
            <Button
              variant="outline"
              size="lg"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="rounded-full w-14 h-14 p-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            {/* Progress Dots */}
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentSlide ? 1 : -1);
                    setCurrentSlide(index);
                    setAutoPlay(false);
                  }}
                  className="group relative"
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'bg-blue-600 scale-125'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                  {index === currentSlide && (
                    <motion.div
                      layoutId="activeSlide"
                      className="absolute inset-0 rounded-full border-2 border-blue-600"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={nextSlide}
              className="rounded-full w-14 h-14 p-0 bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            >
              {currentSlide === slides.length - 1 ? (
                <span className="text-sm font-semibold">Go</span>
              ) : (
                <ChevronRight className="w-6 h-6" />
              )}
            </Button>
          </div>

          {/* Slide Counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8 text-gray-500"
          >
            {currentSlide + 1} / {slides.length}
          </motion.div>
        </div>
      </div>

      {/* Auto-play indicator */}
      {autoPlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Auto-playing...
          </div>
        </motion.div>
      )}
    </div>
  );
}