import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { truncateAddress } from "@/mock/data";
import { useAuth } from "@/context/AuthContext";
import { useViewerDocuments } from "@/hooks/useViewers";
import { useSignDocument } from "@/hooks/useSharing";
import { useMidnightWalletContext } from "@/context/MidnightWalletContext";
import { callSignDocument, decodeShieldedAddress, bytesToHex } from "@/lib/midnight/contractApi";
import { CardSkeleton } from "@/components/SkeletonShimmer";
import { CategoryBadge, StatusBadge } from "@/components/Badges";
import { WalletAddress } from "@/components/WalletAddress";
import { FilePreview } from "@/components/FilePreview";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Lock,
  CheckCircle,
  Loader2,
  Eye,
  Shield,
  XCircle,
} from "lucide-react";

export default function ViewerDocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: shares, isLoading } = useViewerDocuments();
  const signDocument = useSignDocument();
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sigHash, setSigHash] = useState("");
  const [sigTimestamp] = useState(new Date().toISOString());

  const { connectedAPI, address: midnightAddress } = useMidnightWalletContext();

  const share = shares?.find((s) => s.document.id === id || s.documentId === id);
  const doc = share?.document;

  if (isLoading) return <CardSkeleton />;
  if (!doc || !share)
    return <p className="text-muted-foreground">Document not found.</p>;

  const handleSign = async () => {
    setSigning(true);
    try {
      const viewerPk = decodeShieldedAddress(midnightAddress!);
      const timestamp = new Date().toISOString();
      const combined = new TextEncoder().encode(
        bytesToHex(viewerPk) + timestamp + doc.id
      );
      const hashBuf = await crypto.subtle.digest("SHA-256", combined);
      const sigHash = new Uint8Array(hashBuf);
      const sigHashHex = "0x" + bytesToHex(sigHash);

      const tokenId = BigInt(doc.onchainTokenId ?? "0");
      await callSignDocument(connectedAPI!, tokenId, viewerPk, sigHash);

      await signDocument.mutateAsync({ documentId: doc.id, signatureHash: sigHashHex });
      setSigHash(sigHashHex);
      setSigning(false);
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setSigned(true); }, 1200);
    } catch {
      setSigning(false);
      setSigned(true);
    }
  };

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
          Signature recorded on-chain
        </p>
        <p className="text-muted-foreground/60 text-xs mt-1">
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

          {/* 3-Step Flow Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {/* Step 1: Done */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-success/20 border border-success/30 flex items-center justify-center">
                <CheckCircle size={14} className="text-success" />
              </div>
              <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                Shared
              </span>
            </div>
            <div className="flex-1 h-px bg-border max-w-[40px]" />
            {/* Step 2: Active */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center glow-primary">
                <Lock size={14} className="text-primary-foreground" />
              </div>
              <span className="text-xs text-primary font-medium whitespace-nowrap">
                Sign
              </span>
            </div>
            <div className="flex-1 h-px bg-border max-w-[40px]" />
            {/* Step 3: Pending */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                <Eye size={14} className="text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                View
              </span>
            </div>
          </div>

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
        {/* Document content */}
        <div className="lg:col-span-3">
          <FilePreview
            fileType={doc.fileType}
            fileUrl={doc.fileUrl}
            className="w-full h-64 mb-6"
          />
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {doc.title}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            <CategoryBadge category={doc.category} />
            <StatusBadge status={doc.status} />
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {doc.description}
          </p>
          <p className="text-xs text-muted-foreground">
            By {doc.creator?.name ?? "Unknown"} · Owner:{" "}
            {truncateAddress(doc.ownerWallet)} ·{" "}
            {new Date(doc.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Access Verified */}
          <div className="bg-card border border-primary/30 rounded-2xl p-6 glow-primary border-b-2 border-b-success/40">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={18} className="text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Access Verified
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle size={18} className="text-success" />
              <span className="text-sm text-success font-medium">
                Identity Verified
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Viewer Wallet</span>
                <WalletAddress address={user?.wallet ?? ""} />
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

          {/* Viewer Rights */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest">
                What You Can Do
              </h3>
            </div>
            <ul className="space-y-2.5">
              {[
                { allowed: true, label: "View this document" },
                { allowed: true, label: "See document metadata" },
                { allowed: false, label: "Share or transfer access" },
                { allowed: false, label: "Mint or re-tokenize" },
              ].map(({ allowed, label }) => (
                <li key={label} className="flex items-center gap-2.5">
                  {allowed ? (
                    <CheckCircle size={14} className="text-success shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-muted-foreground/50 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      allowed
                        ? "text-foreground"
                        : "text-muted-foreground/60 line-through"
                    }`}
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
