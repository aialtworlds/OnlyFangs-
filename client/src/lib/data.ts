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
    description: 'Acesso ao vestíbulo. Vislumbre o que aguarda além.',
    perks: [
      'Acesso a posts públicos',
      'Feed de descoberta',
      'Newsletter mensal',
    ],
  },
  {
    id: 'initiate',
    name: 'Iniciado',
    latinName: 'Initiatus',
    price: 9.90,
    icon: '🩸',
    description: 'O primeiro passo além do véu. Conteúdo exclusivo desbloqueado.',
    perks: [
      'Todo conteúdo do tier Mortal',
      'Posts exclusivos mensais',
      'Acesso à galeria de imagens',
      'Discord da comunidade',
    ],
  },
  {
    id: 'acolyte',
    name: 'Acólito',
    latinName: 'Acolythus',
    price: 24.90,
    icon: '🦇',
    description: 'Iniciado nos mistérios. Acesso ao grimório completo.',
    perks: [
      'Todo conteúdo do tier Iniciado',
      'Biblioteca completa de livros',
      'Álbuns de música exclusivos',
      'Sessões ao vivo mensais',
      'Menção nos créditos',
    ],
    featured: true,
  },
  {
    id: 'immortal',
    name: 'Imortal',
    latinName: 'Immortalis',
    price: 59.90,
    icon: '👑',
    description: 'Além da morte. Acesso eterno e comunhão direta com o criador.',
    perks: [
      'Todo conteúdo do tier Acólito',
      'Conteúdo exclusivo para Imortais',
      'Mensagem direta com o criador',
      'Prints assinados digitalmente',
      'Acesso vitalício ao arquivo',
      'Co-criação em projetos especiais',
    ],
  },
];

export const CREATORS: Creator[] = [
  {
    id: 'lady-nocturna',
    name: 'Isabela Voss',
    alias: 'Lady Nocturna',
    category: 'Fotografia Gótica',
    avatar: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663776899552/EqrmbXCk9cv2fubgnH6rvo/creator-1-k2JmN6sbHACKjF9wX7PShC.webp',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
    bio: 'Fotógrafa especializada em retratos góticos e dark fashion. Cada imagem é um ritual, cada clique uma invocação.',
    subscribers: 2847,
    totalPosts: 156,
    joinedDate: '2023-09',
    tiers: TIERS,
    tags: ['fotografia', 'dark fashion', 'retratos', 'gótico'],
    contentTypes: ['photo', 'image'],
    featured: true,
    verified: true,
  },
  {
    id: 'lord-vesper',
    name: 'Rodrigo Maldini',
    alias: 'Lord Vesper',
    category: 'Música Sombria',
    avatar: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663776899552/EqrmbXCk9cv2fubgnH6rvo/creator-2-UkheGaNLvsDffbZJvHc9wt.webp',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80',
    bio: 'Compositor e guitarrista de dark ambient e gothic metal. Minhas composições são cartas para o além.',
    subscribers: 1923,
    totalPosts: 89,
    joinedDate: '2023-11',
    tiers: TIERS,
    tags: ['música', 'dark ambient', 'gothic metal', 'composição'],
    contentTypes: ['music'],
    featured: true,
    verified: true,
  },
  {
    id: 'witch-morwen',
    name: 'Camila Darkwood',
    alias: 'Witch Morwen',
    category: 'Arte & Ilustração',
    avatar: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663776899552/EqrmbXCk9cv2fubgnH6rvo/creator-3-PxJjtRxQVnUsPZBpsmvMNW.webp',
    coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&q=80',
    bio: 'Ilustradora de arte sombria, grimórios e bestiários. Cada traço é uma feitiçaria em tinta.',
    subscribers: 3412,
    totalPosts: 234,
    joinedDate: '2023-07',
    tiers: TIERS,
    tags: ['ilustração', 'arte dark', 'grimório', 'bestiário'],
    contentTypes: ['image', 'book'],
    featured: true,
    verified: true,
  },
  {
    id: 'necro-scribe',
    name: 'Viktor Ashwood',
    alias: 'The Necro Scribe',
    category: 'Literatura Sombria',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80',
    bio: 'Escritor de ficção dark fantasy, horror gótico e poesia sombria. Palavras que sangram.',
    subscribers: 1567,
    totalPosts: 67,
    joinedDate: '2024-01',
    tiers: TIERS,
    tags: ['literatura', 'dark fantasy', 'horror', 'poesia'],
    contentTypes: ['book'],
    verified: true,
  },
  {
    id: 'shadow-lens',
    name: 'Valentina Cruz',
    alias: 'Shadow Lens',
    category: 'Fotografia Dark',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1200&q=80',
    bio: 'Fotógrafa de moda alternativa e retratos sombrios. A câmera é meu olho terceiro.',
    subscribers: 987,
    totalPosts: 112,
    joinedDate: '2024-03',
    tiers: TIERS,
    tags: ['fotografia', 'moda alternativa', 'dark art'],
    contentTypes: ['photo', 'image'],
  },
  {
    id: 'blood-composer',
    name: 'Elias Nightfall',
    alias: 'Blood Composer',
    category: 'Música Experimental',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
    bio: 'Produtor de música experimental dark, neoclássico e industrial. Sons do submundo.',
    subscribers: 743,
    totalPosts: 45,
    joinedDate: '2024-02',
    tiers: TIERS,
    tags: ['música', 'experimental', 'neoclássico', 'industrial'],
    contentTypes: ['music'],
  },
];

export const CONTENT_ITEMS: ContentItem[] = [
  // Lady Nocturna — Photos
  {
    id: 'ln-001',
    creatorId: 'lady-nocturna',
    title: 'Véu de Névoa',
    description: 'Série fotográfica em cemitério vitoriano ao amanhecer.',
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
    title: 'Ritual da Lua Negra',
    description: 'Ensaio exclusivo com velas e espelhos antigos.',
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
    title: 'Sangue e Seda',
    description: 'Série completa de dark fashion com 40 imagens em alta resolução.',
    type: 'image',
    thumbnail: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80',
    tier: 'acolyte',
    locked: true,
    likes: 1204,
    comments: 89,
    publishedAt: '2024-06-05',
    resolution: '4K · 40 imagens',
  },
  // Lord Vesper — Music
  {
    id: 'lv-001',
    creatorId: 'lord-vesper',
    title: 'Requiem para o Crepúsculo',
    description: 'Composição para guitarra elétrica e orquestra de câmara.',
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
    title: 'Álbum: As Sete Portas',
    description: 'Álbum completo de 12 faixas. Dark ambient com elementos medievais.',
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
    title: 'Bestiário das Trevas — Vol. I',
    description: 'Grimório ilustrado com 30 criaturas do folclore sombrio.',
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
    title: 'Série: Deusas do Abismo',
    description: 'Ilustrações digitais de alta resolução. 8 obras da série completa.',
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
    title: 'O Grimório Completo',
    description: 'Coleção completa de feitiços, rituais e ilustrações. 300 páginas.',
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
    title: 'Poemas do Fim do Mundo',
    description: 'Coletânea de 33 poemas sombrios. Leitura gratuita para todos.',
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
    title: 'A Cripta — Romance Gótico',
    description: 'Romance de horror gótico. 420 páginas. Exclusivo para Acólitos.',
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
  { id: 'all', name: 'Todos', icon: '✦', count: 234 },
  { id: 'image', name: 'Imagens', icon: '🖼️', count: 89 },
  { id: 'photo', name: 'Fotos', icon: '📷', count: 67 },
  { id: 'music', name: 'Música', icon: '🎵', count: 45 },
  { id: 'book', name: 'Livros', icon: '📖', count: 33 },
];

export const STATS = [
  { value: '4,200+', label: 'Criadores' },
  { value: '89,000+', label: 'Assinantes' },
  { value: '240,000+', label: 'Obras Publicadas' },
  { value: 'R$2.1M+', label: 'Pagos a Criadores' },
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
  initiate: 'Iniciado',
  acolyte: 'Acólito',
  immortal: 'Imortal',
};
