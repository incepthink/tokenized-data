import { useState } from "react";
import { useCollections, useCreateCollection, useCollection } from "@/hooks/useCollections";
import { useDocument } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { CardSkeleton } from "@/components/SkeletonShimmer";
import { EmptyState } from "@/components/EmptyState";
import { CategoryBadge, StatusBadge } from "@/components/Badges";
import { WalletAddress } from "@/components/WalletAddress";
import { FilePreview } from "@/components/FilePreview";
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
import type { ApiCollection } from "@/api/collections";
import type { ApiDocument } from "@/api/documents";

function DocumentDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: doc, isLoading } = useDocument(id ?? "");

  return (
    <Dialog open={!!id} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {doc?.title ?? "Document Details"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : doc ? (
          <div className="space-y-6">
            {doc.fileUrl && (
              <FilePreview fileType={doc.fileType} fileUrl={doc.fileUrl} className="w-full h-64" />
            )}

            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={doc.category} />
              <StatusBadge status={doc.status} />
            </div>

            {doc.description && (
              <p className="text-sm text-muted-foreground">{doc.description}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Owner Wallet</span>
                <WalletAddress address={doc.ownerWallet} />
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Created</span>
                <span className="text-foreground">{new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>
              {doc.tokenId !== null && (
                <div>
                  <span className="text-muted-foreground block mb-1">Token ID</span>
                  <span className="text-foreground font-mono">{doc.tokenId}</span>
                </div>
              )}
              {doc.onchainTokenId && (
                <div>
                  <span className="text-muted-foreground block mb-1">Onchain Token ID</span>
                  <span className="text-foreground font-mono text-xs break-all">{doc.onchainTokenId}</span>
                </div>
              )}
              {doc.contractAddress && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block mb-1">Contract Address</span>
                  <span className="text-foreground font-mono text-xs break-all">{doc.contractAddress}</span>
                </div>
              )}
              {doc.txHash && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block mb-1">Tx Hash</span>
                  <span className="text-foreground font-mono text-xs break-all">{doc.txHash}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CollectionDocuments({ collectionId }: { collectionId: string }) {
  const { data: col } = useCollection(collectionId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!col) return null;

  const docs = col.documents as unknown as ApiDocument[];

  return (
    <>
      <div className="divide-y divide-border">
        {docs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => setSelectedId(doc.id)}
            className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-card-elevated/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-medium">{doc.title}</p>
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
      <DocumentDetailDialog id={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}

export default function CreatorCollections() {
  const { data: collections, isLoading } = useCollections();
  const createCollection = useCreateCollection();
  const [expandedCol, setExpandedCol] = useState<string | null>(null);
  const [newColName, setNewColName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateCollection = async () => {
    if (!newColName.trim()) return;
    try {
      await createCollection.mutateAsync({ name: newColName });
      toast.success(`Collection "${newColName}" created!`);
      setNewColName("");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to create collection");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collections</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Collections group your minted documents. Create a collection first, then mint documents into it.
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
                disabled={createCollection.isPending}
                className="w-full gradient-primary text-primary-foreground rounded-xl"
              >
                {createCollection.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">Step 1</span>
        <span>Create collections</span>
        <span className="text-muted-foreground/30">→</span>
        <span className="text-muted-foreground/50">Step 2: Mint documents</span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !collections || collections.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={48} />}
          title="No collections yet"
          description="Create your first collection to start minting documents."
        />
      ) : (
        <div className="space-y-4">
          {collections.map((col: ApiCollection) => {
            const isExpanded = expandedCol === col.id;

            return (
              <div
                key={col.id}
                className="bg-card border border-border hover:border-primary/30 rounded-2xl overflow-hidden transition-colors"
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
                      {col.documents.length} documents · Created{" "}
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
                    {col.documents.length === 0 ? (
                      <div className="p-6 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">No documents yet</p>
                        <Link to="/creator/mint">
                          <Button size="sm" className="gradient-primary text-primary-foreground rounded-lg text-xs">
                            <Plus size={14} className="mr-1" /> Mint First Document
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <CollectionDocuments collectionId={col.id} />
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
