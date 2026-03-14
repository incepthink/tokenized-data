import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MOCK_DOCUMENTS,
  MOCK_SHARED_WITH_VIEWER,
  MOCK_USERS,
  simulateDelay,
  truncateAddress,
} from "@/mock/data";
import { useAuth } from "@/context/AuthContext";
import { CardSkeleton } from "@/components/SkeletonShimmer";
import { CategoryBadge } from "@/components/Badges";
import { WalletAddress } from "@/components/WalletAddress";
import { FilePreview } from "@/components/FilePreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, CheckCircle, Loader2 } from "lucide-react";

export default function ViewerDocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const doc = MOCK_DOCUMENTS.find((d) => d.id === id);
  const shared = MOCK_SHARED_WITH_VIEWER.find((s) => s.documentId === id);

  useEffect(() => {
    simulateDelay().then(() => setLoading(false));
  }, []);

  if (loading) return <CardSkeleton />;
  if (!doc || !shared)
    return <p className="text-muted-foreground">Document not found.</p>;

  const handleSign = () => {
    setSigning(true);
    setTimeout(() => {
      setSigning(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSigned(true);
      }, 1200);
    }, 1500);
  };

  const sigTimestamp = new Date().toISOString();
  const sigHash =
    "0xsig" +
    Math.random().toString(36).slice(2, 20) +
    Math.random().toString(36).slice(2, 20);

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-checkmark">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center glow-primary-strong">
            <CheckCircle size={40} className="text-primary-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground mt-6">
          Identity Verified
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          Loading document...
        </p>
      </div>
    );
  }

  if (!signed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-card-elevated border border-primary/30 rounded-2xl p-8 sm:p-12 max-w-md w-full text-center animate-pulse-glow">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary">
            <Lock size={28} className="text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Verify Your Identity
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sign a message with your wallet to access this document. Your
            identity and timestamp will be cryptographically recorded.
          </p>

          <div className="bg-card border border-border rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-foreground font-medium">{doc.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <CategoryBadge category={doc.category} />
              <span className="text-xs text-muted-foreground">
                Owner: {truncateAddress(doc.ownerWallet)}
              </span>
            </div>
          </div>

          <Button
            onClick={handleSign}
            disabled={signing}
            className="w-full gradient-primary text-primary-foreground font-semibold py-6 rounded-xl glow-primary hover:glow-primary-strong text-base"
          >
            {signing ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Waiting for wallet signature...
              </>
            ) : (
              "Sign & View Document"
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            This action is irreversible and will be logged in the owner's access
            history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/viewer/dashboard"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Shared With Me
      </Link>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <FilePreview
            fileType={doc.fileType}
            fileUrl={doc.fileUrl}
            className="w-full h-64 mb-6"
          />
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {doc.title}
          </h1>
          <CategoryBadge category={doc.category} />
          <p className="text-muted-foreground text-sm mt-4 mb-4">
            {doc.description}
          </p>
          <p className="text-xs text-muted-foreground">
            By {doc.creatorName} · Owner: {truncateAddress(doc.ownerWallet)} ·{" "}
            {new Date(doc.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card border border-primary/30 rounded-2xl p-6 glow-primary">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Access Verified
            </h3>
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle size={18} className="text-success" />
              <span className="text-sm text-success font-medium">
                Identity Verified
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Viewer Wallet</span>
                <WalletAddress
                  address={user?.wallet || MOCK_USERS.viewer.wallet}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Timestamp</span>
                <span className="text-foreground text-xs">
                  {new Date(sigTimestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Signature</span>
                <span className="text-foreground font-mono text-xs">
                  {truncateAddress(sigHash)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Token ID</span>
                <span className="text-foreground font-mono">{doc.tokenId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
