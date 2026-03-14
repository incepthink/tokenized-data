import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Persona } from "@/mock/data";
import { AppNavbar } from "@/components/AppNavbar";

export function ProtectedRoute({ requiredPersona }: { requiredPersona: Persona }) {
  const { persona } = useAuth();

  if (!persona || persona !== requiredPersona) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
