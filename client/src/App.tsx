import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { Route, Switch } from "wouter";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MusicPlayer from "./components/MusicPlayer";
import { MusicPlayerProvider, useMusicPlayer } from "./contexts/MusicPlayerContext";
// Pages
import Home from "./pages/Home";
import CreatorDashboard from "./pages/CreatorDashboard";
import PatronDashboard from "./pages/PatronDashboard";
import Apply from "./pages/Apply";
import Discover from "./pages/Discover";
import Creators from "./pages/Creators";
import CreatorProfile from "./pages/CreatorProfile";
import NotFound from "./pages/NotFound";
import PatronProfile from "./pages/PatronProfile";
import CreatorAdmin from "./pages/CreatorAdmin";
import CreatorContent from "./pages/CreatorContent";
import Notifications from "./pages/Notifications";
import ModerationDashboard from "./pages/ModerationDashboard";
import SignupPage from "./pages/SignupPage";
import CompleteSignup from "./pages/CompleteSignup";

function AppLayout() {
  const { currentTrack, closePlayer } = useMusicPlayer();
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/creator-dashboard" component={CreatorDashboard} />
        <Route path="/creator-admin" component={CreatorAdmin} />
        <Route path="/patron-dashboard" component={PatronDashboard} />
        <Route path="/apply" component={Apply} />
        <Route path="/discover" component={Discover} />
        <Route path="/creators" component={Creators} />
        <Route path="/creator/:id/content" component={CreatorContent} />
        <Route path="/creator/:id">{(params) => <CreatorProfile creatorId={params.id || ''} />}</Route>
        <Route path="/profile" component={PatronProfile} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/moderation" component={ModerationDashboard} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/complete-signup" component={CompleteSignup} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      <Footer />
      <MusicPlayer track={currentTrack} onClose={closePlayer} />
    </>
  );
}

function Router() {
  return (
    <MusicPlayerProvider>
      <AppLayout />
    </MusicPlayerProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            toastOptions={{
              style: {
                background: "oklch(0.085 0.015 330)",
                border: "1px solid oklch(0.72 0.09 75 / 20%)",
                color: "oklch(0.93 0.02 80)",
                fontFamily: "'Cormorant Garamond', serif",
              },
            }}
          />
          <div className="grain-overlay" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
