import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { NexVaultLogo } from "@/components/NexVaultLogo";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LogOut, Menu, X, User } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = {
  creator: [
    { label: "Dashboard", path: "/creator/dashboard" },
    { label: "Collections", path: "/creator/collections" },
    { label: "Mint Document", path: "/creator/mint" },
  ],
  owner: [
    { label: "My Documents", path: "/owner/dashboard" },
  ],
  viewer: [
    { label: "Shared With Me", path: "/viewer/dashboard" },
  ],
};

export function AppNavbar() {
  const { persona, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = persona ? NAV_LINKS[persona] : [];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={persona ? `/${persona}/dashboard` : "/"}>
            <NexVaultLogo />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "text-foreground bg-card-elevated"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-card-elevated transition-colors">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                    <User size={16} className="text-primary-foreground" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-foreground">{user.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-3 rounded-lg text-sm font-medium ${
                  location.pathname === link.path
                    ? "text-foreground bg-card-elevated"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
