import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import CreatorProfile from "./pages/CreatorProfile";
import Discover from "./pages/Discover";
import Apply from "./pages/Apply";
import Creators from "./pages/Creators";

export type PageId = 'home' | 'discover' | 'creators' | 'creator' | 'categories' | 'pricing' | 'apply';

export interface NavParams {
  id?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [navParams, setNavParams] = useState<NavParams>({});

  const handleNavigate = (page: string, params?: Record<string, string>) => {
    setCurrentPage(page as PageId);
    setNavParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'discover':
        return <Discover onNavigate={handleNavigate} />;
      case 'creators':
        return <Creators onNavigate={handleNavigate} />;
      case 'creator':
        return <CreatorProfile creatorId={navParams.id || 'lady-nocturna'} onNavigate={handleNavigate} />;
      case 'categories':
        return <Discover onNavigate={handleNavigate} />;
      case 'pricing':
        return <Home onNavigate={handleNavigate} />;
      case 'apply':
        return <Apply onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            toastOptions={{
              style: {
                background: 'oklch(0.085 0.015 330)',
                border: '1px solid oklch(0.72 0.09 75 / 20%)',
                color: 'oklch(0.93 0.02 80)',
                fontFamily: "'Cormorant Garamond', serif",
              },
            }}
          />
          {/* Grain texture overlay */}
          <div className="grain-overlay" />
          <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
          <main style={{ paddingTop: currentPage === 'home' ? '0' : '102px' }}>
            {renderPage()}
          </main>
          <Footer />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
