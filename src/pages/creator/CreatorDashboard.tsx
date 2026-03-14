import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { MOCK_COLLECTIONS, MOCK_DOCUMENTS, simulateDelay } from "@/mock/data";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, FolderOpen, Users, Plus } from "lucide-react";
import { StatSkeleton, CardSkeleton } from "@/components/SkeletonShimmer";
import { EmptyState } from "@/components/EmptyState";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    simulateDelay().then(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Total Documents Minted",
      value: MOCK_DOCUMENTS.length,
      icon: FileText,
    },
    {
      label: "Active Collections",
      value: MOCK_COLLECTIONS.length,
      icon: FolderOpen,
    },
    { label: "Unique Owners", value: 1, icon: Users },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your collections and minted documents
          </p>
        </div>
        <Link to="/creator/collections" className="mt-4 sm:mt-0">
          <Button className="gradient-primary text-primary-foreground rounded-xl glow-primary">
            <Plus size={16} className="mr-2" /> New Collection
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          stats.map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <s.icon size={18} className="text-primary" />
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
            </div>
          ))
        )}
      </div>

      {/* Collections */}
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Your Collections
      </h2>
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : MOCK_COLLECTIONS.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={48} />}
          title="No collections yet"
          description="Create your first collection to start minting documents."
          action={
            <Button className="gradient-primary text-primary-foreground rounded-xl">
              Create Collection
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_COLLECTIONS.map((col) => (
            <div
              key={col.id}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {col.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-1">
                {col.documentCount} documents
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Created {new Date(col.createdAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <Link to="/creator/collections">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border text-muted-foreground hover:text-foreground rounded-lg bg-transparent"
                  >
                    View Collection
                  </Button>
                </Link>
                <Link to="/creator/mint">
                  <Button
                    size="sm"
                    className="gradient-primary text-primary-foreground rounded-lg text-xs"
                  >
                    Mint Into
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
