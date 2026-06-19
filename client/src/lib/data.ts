// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Mock Data
// ═══════════════════════════════════════════════════════════

export type ContentType = 'image' | 'photo' | 'music' | 'book';
export type TierLevel = 'mortal' | 'initiate' | 'acolyte' | 'immortal';

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
    id: 'mortal',
    name: 'Mortal',
    latinName: 'Homo Mortalis',
    price: 0,
    icon: '🕯️',
    description: 'Access to the vestibule. A glimpse of what awaits beyond.',
    perks: [
      'Access to public posts',
      'Discovery feed',
      'Monthly newsletter',
    ],
  },
  {
    id: 'initiate',
    name: 'Initiate',
    latinName: 'Initiatus',
    price: 9.90,
    icon: '🩸',
    description: 'The first step beyond the veil. Exclusive content unlocked.',
    perks: [
      'All Mortal tier content',
      'Monthly exclusive posts',
      'Access to image gallery',
      'Community Discord',
    ],
  },
  {
    id: 'acolyte',
    name: 'Acolyte',
    latinName: 'Acolythus',
    price: 24.90,
    icon: '🦇',
    description: 'Initiated into the mysteries. Access to the complete grimoire.',
    perks: [
      'All Initiate tier content',
      'Complete book library',
      'Exclusive music albums',
      'Monthly live sessions',
      'Credits mention',
    ],
    featured: true,
  },
  {
    id: 'immortal',
    name: 'Immortal',
    latinName: 'Immortalis',
    price: 59.90,
    icon: '👑',
    description: 'Beyond death. Eternal access and direct communion with the creator.',
    perks: [
      'All Acolyte tier content',
      'Exclusive content for Immortals',
      'Direct message with the creator',
      'Digitally signed prints',
      'Lifetime archive access',
      'Co-creation on special projects',
    ],
  },
];

export const CREATORS: Creator[] = [
  {
    id: 'lady-nocturna',
    name: 'Isabela Voss',
    alias: 'Lady Nocturna',
    category: 'Gothic Photography',
    avatar: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663776899552/EqrmbXCk9cv2fubgnH6rvo/creator-1-k2JmN6sbHACKjF9wX7PShC.webp',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
    bio: 'Photographer specializing in gothic portraits and dark fashion. Every image is a ritual, every click an invocation.',
    subscribers: 2847,
    totalPosts: 156,
    joinedDate: '2023-09',
    tiers: TIERS,
    tags: ['photography', 'dark fashion', 'portraits', 'gothic'],
    contentTypes: ['photo', 'image'],
    featured: true,
    verified: true,
  },
  {
    id: 'lord-vesper',
    name: 'Rodrigo Maldini',
    alias: 'Lord Vesper',
    category: 'Dark Music',
    avatar: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663776899552/EqrmbXCk9cv2fubgnH6rvo/creator-2-UkheGaNLvsDffbZJvHc9wt.webp',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80',
    bio: 'Composer and guitarist of dark ambient and gothic metal. My compositions are letters to the beyond.',
    subscribers: 1923,
    totalPosts: 89,
    joinedDate: '2023-11',
    tiers: TIERS,
    tags: ['music', 'dark ambient', 'gothic metal', 'composition'],
    contentTypes: ['music'],
    featured: true,
    verified: true,
  },
  {
    id: 'witch-morwen',
    name: 'Camila Darkwood',
    alias: 'Witch Morwen',
    category: 'Art & Illustration',
    avatar: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663776899552/EqrmbXCk9cv2fubgnH6rvo/creator-3-PxJjtRxQVnUsPZBpsmvMNW.webp',
    coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&q=80',
    bio: 'Illustrator of dark art, grimoires and bestiaries. Every stroke is a spell in ink.',
    subscribers: 3412,
    totalPosts: 234,
    joinedDate: '2023-07',
    tiers: TIERS,
    tags: ['illustration', 'dark art', 'grimoire', 'bestiary'],
    contentTypes: ['image', 'book'],
    featured: true,
    verified: true,
  },
  {
    id: 'necro-scribe',
    name: 'Viktor Ashwood',
    alias: 'The Necro Scribe',
    category: 'Dark Literature',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80',
    bio: 'Writer of dark fantasy fiction, gothic horror and dark poetry. Words that bleed.',
    subscribers: 1567,
    totalPosts: 67,
    joinedDate: '2024-01',
    tiers: TIERS,
    tags: ['literature', 'dark fantasy', 'horror', 'poetry'],
    contentTypes: ['book'],
    verified: true,
  },
  {
    id: 'shadow-lens',
    name: 'Valentina Cruz',
    alias: 'Shadow Lens',
    category: 'Dark Photography',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1200&q=80',
    bio: 'Alternative fashion photographer and dark portraits. The camera is my third eye.',
    subscribers: 987,
    totalPosts: 112,
    joinedDate: '2024-03',
    tiers: TIERS,
    tags: ['photography', 'alternative fashion', 'dark art'],
    contentTypes: ['photo', 'image'],
  },
  {
    id: 'blood-composer',
    name: 'Elias Nightfall',
    alias: 'Blood Composer',
    category: 'Experimental Music',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
    bio: 'Producer of experimental dark, neoclassical and industrial music. Sounds from the underworld.',
    subscribers: 743,
    totalPosts: 45,
    joinedDate: '2024-02',
    tiers: TIERS,
    tags: ['music', 'experimental', 'neoclassical', 'industrial'],
    contentTypes: ['music'],
  },
];

export const CONTENT_ITEMS: ContentItem[] = [
  // Lady Nocturna — Photos
  {
    id: 'ln-001',
    creatorId: 'lady-nocturna',
    title: 'Veil of Mist',
    description: 'Photographic series in a Victorian cemetery at dawn.',
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    tier: 'mortal',
    locked: false,
    likes: 342,
    comments: 28,
    publishedAt: '2024-06-10',
  },
  {
    id: 'ln-002',
    creatorId: 'lady-nocturna',
    title: 'Black Moon Ritual',
    description: 'Exclusive photoshoot with candles and antique mirrors.',
    type: 'photo',
    thumbnail: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=600&q=80',
    tier: 'initiate',
    locked: true,
    likes: 891,
    comments: 67,
    publishedAt: '2024-06-08',
  },
  {
    id: 'ln-003',
    creatorId: 'lady-nocturna',
    title: 'Blood and Silk',
    description: 'Complete dark fashion series with 40 high-resolution images.',
    type: 'image',
    thumbnail: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80',
    tier: 'acolyte',
    locked: true,
    likes: 1204,
    comments: 89,
    publishedAt: '2024-06-05',
    resolution: '4K · 40 images',
  },
  // Lord Vesper — Music
  {
    id: 'lv-001',
    creatorId: 'lord-vesper',
    title: 'Requiem for Twilight',
    description: 'Composition for electric guitar and chamber orchestra.',
    type: 'music',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    tier: 'mortal',
    locked: false,
    likes: 567,
    comments: 43,
    publishedAt: '2024-06-09',
    duration: '7:23',
  },
  {
    id: 'lv-002',
    creatorId: 'lord-vesper',
    title: 'Album: The Seven Gates',
    description: 'Complete 12-track album. Dark ambient with medieval elements.',
    type: 'music',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
    tier: 'acolyte',
    locked: true,
    likes: 2341,
    comments: 178,
    publishedAt: '2024-06-01',
    duration: '58:47',
  },
  // Witch Morwen — Art & Books
  {
    id: 'wm-001',
    creatorId: 'witch-morwen',
    title: 'Bestiary of Darkness — Vol. I',
    description: 'Illustrated grimoire with 30 creatures from dark folklore.',
    type: 'book',
    thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
    tier: 'initiate',
    locked: true,
    likes: 1876,
    comments: 134,
    publishedAt: '2024-05-28',
    pages: 120,
    previewPages: 15,
  },
  {
    id: 'wm-002',
    creatorId: 'witch-morwen',
    title: 'Series: Goddesses of the Abyss',
    description: 'High-resolution digital illustrations. 8 works from the complete series.',
    type: 'image',
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80',
    tier: 'mortal',
    locked: false,
    likes: 3201,
    comments: 267,
    publishedAt: '2024-06-07',
  },
  {
    id: 'wm-003',
    creatorId: 'witch-morwen',
    title: 'The Complete Grimoire',
    description: 'Complete collection of spells, rituals and illustrations. 300 pages.',
    type: 'book',
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80',
    tier: 'immortal',
    locked: true,
    likes: 4521,
    comments: 389,
    publishedAt: '2024-05-15',
    pages: 300,
    previewPages: 20,
  },
  // Necro Scribe — Books
  {
    id: 'ns-001',
    creatorId: 'necro-scribe',
    title: 'Poems of the World\'s End',
    description: 'Collection of 33 dark poems. Free reading for all.',
    type: 'book',
    thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
    tier: 'mortal',
    locked: false,
    likes: 892,
    comments: 71,
    publishedAt: '2024-06-11',
    pages: 48,
    previewPages: 48,
  },
  {
    id: 'ns-002',
    creatorId: 'necro-scribe',
    title: 'The Crypt — Gothic Romance',
    description: 'Gothic horror novel. 420 pages. Exclusive for Acolytes.',
    type: 'book',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    tier: 'acolyte',
    locked: true,
    likes: 1234,
    comments: 98,
    publishedAt: '2024-05-20',
    pages: 420,
    previewPages: 30,
  },
];

export const CATEGORIES = [
  { id: 'all', name: 'All', icon: '✦', count: 234 },
  { id: 'image', name: 'Images', icon: '🖼️', count: 89 },
  { id: 'photo', name: 'Photos', icon: '📷', count: 67 },
  { id: 'music', name: 'Music', icon: '🎵', count: 45 },
  { id: 'book', name: 'Books', icon: '📖', count: 33 },
];

export const STATS = [
  { value: '—', label: 'Creators' },
  { value: '—', label: 'Subscribers' },
  { value: '—', label: 'Releases Published' },
  { value: '—', label: 'Paid to Creators' },
];

export function getCreatorById(id: string): Creator | undefined {
  return CREATORS.find(c => c.id === id);
}

export function getContentByCreator(creatorId: string): ContentItem[] {
  return CONTENT_ITEMS.filter(c => c.creatorId === creatorId);
}

export function getContentByType(type: ContentType): ContentItem[] {
  return CONTENT_ITEMS.filter(c => c.type === type);
}

export function getFeaturedCreators(): Creator[] {
  return CREATORS.filter(c => c.featured);
}

export const TIER_COLORS: Record<TierLevel, string> = {
  mortal: 'oklch(0.55 0.03 60)',
  initiate: 'oklch(0.72 0.09 75)',
  acolyte: 'oklch(0.72 0.09 75)',
  immortal: 'oklch(0.82 0.1 78)',
};

export const TIER_LABELS: Record<TierLevel, string> = {
  mortal: 'Mortal',
  initiate: 'Initiate',
  acolyte: 'Acolyte',
  immortal: 'Immortal',
};
