export const generateAvatar = (gender: 'male' | 'female' | 'other', seed?: string): string => {
  const seedValue = seed || Math.random().toString();
  
  if (gender === 'male') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedValue}&style=circle&backgroundColor=b6e3f4&mouth=smile&eyes=default`;
  } else if (gender === 'female') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedValue}&style=circle&backgroundColor=ffdfbf&hair=long&mouth=smile&eyes=default`;
  } else {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seedValue}&backgroundColor=c0aede`;
  }
};

export const getPointsForDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): number => {
  switch (difficulty) {
    case 'easy':
      return 10;
    case 'medium':
      return 25;
    case 'hard':
      return 50;
    default:
      return 10;
  }
};
