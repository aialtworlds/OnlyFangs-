
// ONLY FANGS — Mock Data
// ═══════════════════════════════════════════════════════════

export type ContentType = 'image' | 'photo' | 'music' | 'book';
export type TierLevel = 'fledgling' | 'dweller' | 'courtier' | 'night-royalty';

export interface Tier {
  id: TierLevel;
  name: string;
  latinName: string;
  price: number;
  icon: string;
  description: string;
  perks: string[];
  featured?: boolean;
}

export interface Creator {
  id: string;
  name: string;
  alias: string;
  category: string;
  avatar: string;
  coverImage: string;
  bio: string;
  subscribers: number;
  totalPosts: number;
  joinedDate: string;
  tiers: Tier[];
  tags: string[];
  contentTypes: ContentType[];
  featured?: boolean;
  verified?: boolean;
  isDemo?: boolean;
}

export interface ContentItem {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  type: ContentType;
  thumbnail: string;
  tier: TierLevel;
  locked: boolean;
  likes: number;
  comments: number;
  publishedAt: string;
  // Music specific
  duration?: string;
  audioUrl?: string;
  // Book specific
  pages?: number;
  previewPages?: number;
  // Image/Photo specific
  resolution?: string;
}

export const TIERS: Tier[] = [
  {
    id: 'fledgling',
    name: 'Fledgling',
    latinName: '',
    price: 0,
    icon: '',
    description: 'Access to public posts and discovery. The first step into ONLY FANGS.',
    perks: [
      'Access to public posts',
      'Discovery feed',
      'Monthly newsletter',
    ],
  },
  {
    id: 'dweller',
    name: 'Dweller',
    latinName: '',
    price: 9.90,
    icon: '',
    description: 'Exclusive content and community access. Unlock more from your favorite creators.',
    perks: [
      'All Fledgling tier content',
      'Monthly exclusive posts',
      'Access to image gallery',
      'Community Discord',
    ],
  },
  {
    id: 'courtier',
    name: 'Courtier',
    latinName: '',
    price: 24.90,
    icon: '',
    description: 'Full access to exclusive content, live sessions, and direct creator contact.',
    perks: [
      'All Dweller tier content',
      'Complete book library',
      'Exclusive music albums',
      'Monthly live sessions',
      'Credits mention',
    ],
    featured: true,
  },
  {
    id: 'night-royalty',
    name: 'Night Royalty',
    latinName: '',
    price: 59.90,
    icon: '',
    description: 'Full access to everything this creator shares, plus direct contact.',
    perks: [
      'All Courtier tier content',
      'Exclusive content for Night Royalty members',
      'Direct message with the creator',
      'Digitally signed prints',
      'Lifetime archive access',
      'Co-creation on special projects',
    ],
  },
];

export const CATEGORIES = [
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'visual-art', name: 'Visual Art', icon: '🎨' },
  { id: 'writing', name: 'Writing', icon: '✍️' },
  { id: 'photography', name: 'Photography', icon: '📸' },
  { id: 'performance', name: 'Performance', icon: '🎭' },
  { id: 'design', name: 'Design', icon: '🖌️' },
];

export const CONTENT_TYPES = [
  { id: 'image', name: 'Image', icon: '🖼️' },
  { id: 'photo', name: 'Photo', icon: '📷' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'book', name: 'Book', icon: '📚' },
];

export const STATS = [
  { label: 'Active Creators', value: '2,847', change: '+12%' },
  { label: 'Patrons', value: '18,392', change: '+8%' },
  { label: 'Content Pieces', value: '94,521', change: '+23%' },
];

export const CREATORS: Creator[] = [
  {
    id: 'lady-nocturna',
    name: 'Lady Nocturna',
    alias: 'Lady Nocturna',
    category: 'Music',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=400&fit=crop',
    bio: 'Dark ambient and electronic music producer. Creating immersive soundscapes.',
    subscribers: 3421,
    totalPosts: 156,
    joinedDate: '2023-01-15',
    tiers: TIERS,
    tags: ['music', 'ambient', 'electronic'],
    contentTypes: ['music'],
    verified: true,
    featured: true,
    isDemo: true,
  },
  {
    id: 'raven-ink',
    name: 'Raven Ink',
    alias: 'Raven Ink',
    category: 'Writing',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=1200&h=400&fit=crop',
    bio: 'Gothic fiction and dark poetry. Exploring the shadows of human experience.',
    subscribers: 2156,
    totalPosts: 89,
    joinedDate: '2023-03-22',
    tiers: TIERS,
    tags: ['writing', 'poetry', 'fiction'],
    contentTypes: ['book'],
    isDemo: true,
  },
  {
    id: 'shadow-lens',
    name: 'Shadow Lens',
    alias: 'Shadow Lens',
    category: 'Photography',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&h=400&fit=crop',
    bio: 'Moody landscape and portrait photography. Capturing the essence of darkness.',
    subscribers: 1876,
    totalPosts: 234,
    joinedDate: '2023-05-10',
    tiers: TIERS,
    tags: ['photography', 'landscape', 'portrait'],
    contentTypes: ['photo'],
    verified: true,
    isDemo: true,
  },
];

export const CONTENT_ITEMS: ContentItem[] = [
  {
    id: 'content-1',
    creatorId: 'lady-nocturna',
    title: 'Midnight Echoes',
    description: 'A haunting ambient composition exploring themes of solitude and reflection.',
    type: 'music',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
    tier: 'dweller',
    locked: false,
    likes: 234,
    comments: 45,
    publishedAt: '2024-01-15',
    duration: '8:32',
  },
  {
    id: 'content-2',
    creatorId: 'raven-ink',
    title: 'The Void Speaks',
    description: 'A collection of dark poetry exploring existential themes.',
    type: 'book',
    thumbnail: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=400&h=300&fit=crop',
    tier: 'courtier',
    locked: true,
    likes: 156,
    comments: 32,
    publishedAt: '2024-01-10',
    pages: 128,
    previewPages: 12,
  },
  {
    id: 'content-3',
    creatorId: 'shadow-lens',
    title: 'Nocturnal Landscapes',
    description: 'A series of moody landscape photographs taken at night.',
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
    tier: 'fledgling',
    locked: false,
    likes: 512,
    comments: 89,
    publishedAt: '2024-01-08',
    resolution: '4K',
  },
];

export function getFeaturedCreators(): Creator[] {
  return CREATORS.filter((c) => c.featured);
}

export function getCreatorById(id: string): Creator | undefined {
  return CREATORS.find((c) => c.id === id);
}

export function getContentByCreatorId(creatorId: string): ContentItem[] {
  return CONTENT_ITEMS.filter((c) => c.creatorId === creatorId);
}
