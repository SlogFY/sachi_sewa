import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Heart, CircleUser, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminPanel from "./AdminPanel";
import UserProfileDropdown from "./UserProfileDropdown";
import NotificationBell from "./NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === "SIGNED_OUT") {
        setIsAdmin(false);
      } else if (session?.user) {
        setTimeout(() => {
          checkAdminStatus(session.user.id);
        }, 0);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle admin panel open from auth redirect
  useEffect(() => {
    if (location.state?.openAdminPanel && isAdmin) {
      setIsAdminPanelOpen(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isAdmin]);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "owner"])
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const handleAuthClick = () => {
    navigate("/auth");
  };

  const isHomePage = location.pathname === "/";

  const navLinks = [
    { name: "Home", href: "/", isRoute: true },
    { name: "About", href: "/about", isRoute: true },
    { name: "Causes", href: "/causes", isRoute: true },
    { name: "Fundraisers", href: "/fundraisers", isRoute: true },
    { name: "How It Works", href: "/how-it-works", isRoute: true },
    { name: "Contact", href: "/contact", isRoute: true },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-card/95 backdrop-blur-md shadow-md py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center shadow-glow">
            <Heart className="w-5 h-5 text-primary-foreground fill-current" />
          </div>
          <span className="text-2xl font-display font-bold text-foreground">
            Sacchi<span className="text-primary">Sewa</span>
          </span>
        </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-foreground/90 hover:text-primary transition-colors duration-200 font-bold text-sm tracking-wide"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-foreground/90 hover:text-primary transition-colors duration-200 font-bold text-sm tracking-wide"
                >
                  {link.name}
                </a>
              )
            )}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <NotificationBell />
                <UserProfileDropdown 
                  user={user} 
                  isAdmin={isAdmin} 
                  onAdminClick={() => setIsAdminPanelOpen(true)} 
                />
              </>
            ) : (
              <Button variant="ghost" size="icon" onClick={handleAuthClick} title="Login">
                <CircleUser className="w-5 h-5" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => {
              if (location.pathname === '/start-fundraiser') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/start-fundraiser');
              }
            }}>
              Start a Fundraiser
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => navigate('/monthly-donate')}
              className="relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-1">
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  ❤️
                </motion.span>
                Monthly Donate
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                style={{ opacity: 0.3 }}
              />
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-foreground"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-card border-t border-border"
            >
              <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
                {navLinks.map((link) =>
                  link.isRoute ? (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-foreground hover:text-primary transition-colors py-2 font-medium"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-foreground hover:text-primary transition-colors py-2 font-medium"
                    >
                      {link.name}
                    </a>
                  )
                )}
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-semibold">
                          {(user.user_metadata?.full_name || user.email)?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.user_metadata?.full_name || user.email?.split("@")[0]}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          onClick={() => { setIsMobileMenuOpen(false); setIsAdminPanelOpen(true); }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        My Dashboard
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { setIsMobileMenuOpen(false); navigate('/auth'); }}>
                      <CircleUser className="w-4 h-4 mr-2" />
                      Login / Sign Up
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => { 
                    setIsMobileMenuOpen(false); 
                    if (location.pathname === '/start-fundraiser') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      navigate('/start-fundraiser'); 
                    }
                  }}>
                    Start a Fundraiser
                  </Button>
                  <Button variant="primary" className="w-full" onClick={() => { setIsMobileMenuOpen(false); navigate('/monthly-donate'); }}>
                    ❤️ Monthly Donate
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />
    </>
  );
};

export default Navbar;
