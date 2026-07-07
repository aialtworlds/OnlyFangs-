import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface CategoryFilterProps {
  onCategoryChange: (category: string) => void;
  selectedCategory?: string;
}

export default function CategoryFilter({
  onCategoryChange,
  selectedCategory = 'all',
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: categories = [], isLoading } = trpc.creator.categories.useQuery();

  const allCategories = ['all', ...categories];

  const getCategoryLabel = (cat: string) => {
    if (cat === 'all') return 'Todas as categorias';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 w-full sm:w-auto"
      >
        {getCategoryLabel(selectedCategory)}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 bg-background border border-border rounded-lg shadow-lg z-50 min-w-[200px]">
          {isLoading ? (
            <div className="p-3 text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <div className="py-1">
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    onCategoryChange(category);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
