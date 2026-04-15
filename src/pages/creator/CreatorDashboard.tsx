import { useAuth } from "@/context/AuthContext";
import { useCollections } from "@/hooks/useCollections";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, FolderOpen, Users, Plus } from "lucide-react";
import { StatSkeleton, CardSkeleton } from "@/components/SkeletonShimmer";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const { data: collections, isLoading } = useCollections();

  const totalDocs =
    collections?.reduce((sum, c) => sum + c.documents.length, 0) ?? 0;

  const stats = [
    {
      label: "Documents Minted",
      value: totalDocs,
      icon: FileText,
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      accent: "border-b-primary/40",
    },
    {
      label: "Active Collections",
      value: collections?.length ?? 0,
      icon: FolderOpen,
      iconBg: "bg-secondary/15",
      iconColor: "text-secondary",
      accent: "border-b-secondary/40",
    },
    {
      label: "Unique Owners",
      value: 1,
      icon: Users,
      iconBg: "bg-success/15",
      iconColor: "text-success",
      accent: "border-b-success/40",
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's your creator workspace — follow the steps below if you're just getting started.
          </p>
        </div>
        <Link to="/creator/mint" className="mt-4 sm:mt-0">
          <Button className="gradient-primary text-primary-foreground rounded-xl glow-primary">
            <Plus size={16} className="mr-2" /> New File
          </Button>
        </Link>
      </div>

      {/* "How it works" workflow strip — shown until user has minted something */}
      {totalDocs === 0 && !isLoading && (
        <div className="bg-card border border-primary/20 rounded-2xl p-6 mb-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">
            How it works — get started in 3 steps
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Create a Collection</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Group related documents together — like a folder for your NFTs.
                </p>
                <Link
                  to="/creator/collections"
                  className="text-xs text-primary underline underline-offset-2 mt-2 inline-block"
                >
                  Go to Collections →
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary text-sm font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Mint a Document</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Upload a file, add details, and assign it to an owner's wallet address.
                </p>
                <Link
                  to="/creator/mint"
                  className={`text-xs underline underline-offset-2 mt-2 inline-block ${
                    collections?.length === 0
                      ? "text-muted-foreground pointer-events-none"
                      : "text-primary"
                  }`}
                >
                  {collections?.length === 0 ? "Create a collection first" : "Mint a Document →"}
                </Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-success/20 text-success text-sm font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Owner Gets Access</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  The assigned wallet can view and sign the document on the Midnight network.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          stats.map((s) => (
            <div
              key={s.label}
              className={`bg-card border border-border border-b-2 ${s.accent} rounded-2xl p-6`}
            >
              <div
                className={`w-10 h-10 rounded-xl ${s.iconBg} ${s.iconColor} flex items-center justify-center mb-3`}
              >
                <s.icon size={18} />
              </div>
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                {s.label}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Collections */}
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Your Collections
      </h2>
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !collections || collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-border">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FolderOpen size={32} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Start by creating a collection
          </h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
            Collections are folders for your documents. Create one first, then mint documents into it.
          </p>
          <div className="flex gap-3">
            <Link to="/creator/collections">
              <Button className="gradient-primary text-primary-foreground rounded-xl glow-primary">
                <Plus size={16} className="mr-2" /> Create Collection
              </Button>
            </Link>
            <Button
              variant="outline"
              disabled
              className="border-border text-muted-foreground rounded-xl bg-transparent opacity-50 cursor-not-allowed"
            >
              Mint Document
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-3">
            You need a collection before you can mint
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <div
              key={col.id}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors"
            >
              {/* Card header row with doc-count pill */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {col.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 ml-2">
                  {col.documents.length} docs
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {col.documents.length} documents
              </p>
              <div className="flex items-center justify-between">
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
                      Add File
                    </Button>
                  </Link>
                </div>
                <span className="text-xs text-muted-foreground/60">
                  {new Date(col.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
