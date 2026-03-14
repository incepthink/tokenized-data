import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MOCK_DOCUMENTS,
  MOCK_VIEWERS,
  MOCK_SHARED_WITH,
  MOCK_ACCESS_LOGS,
  simulateDelay,
  truncateAddress,
} from "@/mock/data";
import { CardSkeleton } from "@/components/SkeletonShimmer";
import { CategoryBadge, NftBadge } from "@/components/Badges";
import { WalletAddress } from "@/components/WalletAddress";
import { FilePreview } from "@/components/FilePreview";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Eye, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function OwnerDocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [selectedViewer, setSelectedViewer] = useState("");
  const [sharedWith, setSharedWith] = useState(
    MOCK_SHARED_WITH[id || ""] || [],
  );
  const [accessLogs] = useState(MOCK_ACCESS_LOGS[id || ""] || []);
  const [nftOpen, setNftOpen] = useState(false);

  const doc = MOCK_DOCUMENTS.find((d) => d.id === id);

  useEffect(() => {
    simulateDelay().then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-8">
        <CardSkeleton />
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!doc) {
    return <p className="text-muted-foreground">Document not found.</p>;
  }

  const handleGrant = () => {
    const viewer = MOCK_VIEWERS.find((v) => v.id === selectedViewer);
    if (!viewer) return;
    setSharedWith((prev) => [
      ...prev,
      {
        viewerId: viewer.id,
        viewerName: viewer.name,
        viewerWallet: viewer.wallet,
        grantedAt: new Date().toISOString(),
      },
    ]);
    setSelectedViewer("");
    toast.success(`Access granted to ${viewer.name}`);
  };

  const handleRevoke = (viewerId: string) => {
    const viewer = sharedWith.find((v) => v.viewerId === viewerId);
    setSharedWith((prev) => prev.filter((v) => v.viewerId !== viewerId));
    toast.success(`Access revoked for ${viewer?.viewerName}`);
  };

  const availableViewers = MOCK_VIEWERS.filter(
    (v) => !sharedWith.some((s) => s.viewerId === v.id),
  );

  return (
    <div>
      <Link
        to="/owner/dashboard"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> My Documents
      </Link>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left - Document detail (3 cols) */}
        <div className="lg:col-span-3">
          <FilePreview
            fileType={doc.fileType}
            fileUrl={doc.fileUrl}
            className="w-full h-64 mb-6"
          />
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {doc.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <CategoryBadge category={doc.category} />
            <NftBadge />
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {doc.description}
          </p>
          <p className="text-xs text-muted-foreground">
            By {doc.creatorName} ·{" "}
            {new Date(doc.createdAt).toLocaleDateString()} · Base Sepolia
          </p>

          <Collapsible
            open={nftOpen}
            onOpenChange={setNftOpen}
            className="mt-6"
          >
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown
                size={16}
                className={`transition-transform ${nftOpen ? "rotate-180" : ""}`}
              />
              NFT Details
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 bg-card-elevated border border-border rounded-2xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Token ID</span>
                <span className="text-foreground font-mono">{doc.tokenId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contract</span>
                <a
                  href={`https://sepolia.basescan.org/token/${doc.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-mono flex items-center gap-1"
                >
                  {truncateAddress(doc.contractAddress)}{" "}
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tx Hash</span>
                <a
                  href={`https://sepolia.basescan.org/tx/${doc.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-mono flex items-center gap-1"
                >
                  {truncateAddress(doc.txHash)} <ExternalLink size={12} />
                </a>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Right - Share + Access Log (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Share card */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Grant Access
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Share with a Viewer
            </p>

            <div className="flex gap-2 mb-4">
              <Select value={selectedViewer} onValueChange={setSelectedViewer}>
                <SelectTrigger className="bg-card-elevated border-border text-foreground flex-1">
                  <SelectValue placeholder="Select viewer..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {availableViewers.map((v) => (
                    <SelectItem
                      key={v.id}
                      value={v.id}
                      className="text-foreground"
                    >
                      {v.name} · {truncateAddress(v.wallet)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleGrant}
                disabled={!selectedViewer}
                className="gradient-primary text-primary-foreground rounded-xl glow-primary"
              >
                Grant
              </Button>
            </div>

            {sharedWith.length > 0 && (
              <div className="space-y-3">
                {sharedWith.map((s) => (
                  <div
                    key={s.viewerId}
                    className="flex items-center justify-between bg-card-elevated rounded-xl p-3"
                  >
                    <div>
                      <p className="text-sm text-foreground font-medium">
                        {s.viewerName}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {truncateAddress(s.viewerWallet)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Granted {new Date(s.grantedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-destructive text-xs hover:underline">
                          Revoke
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">
                            Revoke access for {s.viewerName}?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            They will no longer be able to view this document.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-card-elevated border-border text-foreground">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevoke(s.viewerId)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Access Log */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Who Viewed This Document
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Verified on-chain access history
            </p>

            {accessLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No views yet. Access events will appear here when a Viewer signs
                in.
              </p>
            ) : (
              <div className="space-y-3">
                {accessLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 bg-card-elevated rounded-xl p-3"
                  >
                    <Eye size={16} className="text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{log.viewerName}</span>{" "}
                        accessed this document
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.accessedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs bg-success/20 text-success border border-success/30 px-2 py-0.5 rounded-full shrink-0">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
