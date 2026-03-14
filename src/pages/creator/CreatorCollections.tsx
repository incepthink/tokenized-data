import { useState, useEffect } from "react";
import { MOCK_COLLECTIONS, MOCK_DOCUMENTS, simulateDelay } from "@/mock/data";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { CardSkeleton } from "@/components/SkeletonShimmer";
import { EmptyState } from "@/components/EmptyState";
import { CategoryBadge, StatusBadge } from "@/components/Badges";
import { WalletAddress } from "@/components/WalletAddress";
import { FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CreatorCollections() {
  const [loading, setLoading] = useState(true);
  const [expandedCol, setExpandedCol] = useState<string | null>(null);
  const [newColName, setNewColName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    simulateDelay().then(() => setLoading(false));
  }, []);

  const handleCreateCollection = () => {
    if (!newColName.trim()) return;
    toast.success(`Collection "${newColName}" created!`);
    setNewColName("");
    setDialogOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collections</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All your document collections
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground rounded-xl glow-primary">
              <Plus size={16} className="mr-2" /> New Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Create Collection
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Collection Name</Label>
                <Input
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Legal Documents"
                  className="bg-card-elevated border-border text-foreground mt-1"
                />
              </div>
              <Button
                onClick={handleCreateCollection}
                className="w-full gradient-primary text-primary-foreground rounded-xl"
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : MOCK_COLLECTIONS.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={48} />}
          title="No collections yet"
          description="Create your first collection to start minting documents."
        />
      ) : (
        <div className="space-y-4">
          {MOCK_COLLECTIONS.map((col) => {
            const docs = MOCK_DOCUMENTS.filter(
              (d) => d.collectionId === col.id,
            );
            const isExpanded = expandedCol === col.id;

            return (
              <div
                key={col.id}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedCol(isExpanded ? null : col.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-card-elevated/50 transition-colors"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {col.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {col.documentCount} documents · Created{" "}
                      {new Date(col.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={20} className="text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {docs.length === 0 ? (
                      <p className="p-6 text-sm text-muted-foreground">
                        No documents in this collection.
                      </p>
                    ) : (
                      <div className="divide-y divide-border">
                        {docs.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground font-medium">
                                {doc.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <CategoryBadge category={doc.category} />
                                <StatusBadge status={doc.status} />
                                <WalletAddress address={doc.ownerWallet} />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
