import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Persona } from "@/mock/data";
import { AppNavbar } from "@/components/AppNavbar";

export function ProtectedRoute({ requiredPersona }: { requiredPersona: Persona }) {
  const { persona, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (!persona || persona !== requiredPersona) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage: [
          "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(239 84% 67% / 0.07) 0%, transparent 70%)",
          "radial-gradient(circle, hsl(240 20% 25% / 0.15) 1px, transparent 1px)"
        ].join(", "),
        backgroundSize: "100% 100%, 28px 28px"
      }}
    >
      <AppNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
