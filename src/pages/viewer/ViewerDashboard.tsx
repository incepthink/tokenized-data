import { Link } from "react-router-dom";
import { useViewerDocuments } from "@/hooks/useViewers";
import { CardSkeleton, StatSkeleton } from "@/components/SkeletonShimmer";
import { CategoryBadge, StatusBadge } from "@/components/Badges";
import { WalletAddress } from "@/components/WalletAddress";
import { FilePreview } from "@/components/FilePreview";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Tag,
  ShieldCheck,
  Info,
  Inbox,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function ViewerDashboard() {
  const { data: shares, isLoading } = useViewerDocuments();

  const totalShared = shares?.length ?? 0;
  const uniqueCategories = shares
    ? new Set(shares.map((s) => s.document.category)).size
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Shared With Me
          </h1>
          <p className="text-muted-foreground text-sm">
            Documents that owners have granted you access to
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mt-1">
          Viewer Mode
        </span>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <div className="bg-card border border-border rounded-2xl p-5 border-b-2 border-b-primary/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <FileText size={18} className="text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalShared}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                Documents Shared
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 border-b-2 border-b-secondary/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center">
                  <Tag size={18} className="text-secondary" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {uniqueCategories}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                Categories
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 border-b-2 border-b-success/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-success" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {totalShared > 0 ? "Active" : "—"}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                Access Status
              </p>
            </div>
          </>
        )}
      </div>

      {/* Info Banner */}
      {!isLoading && totalShared > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3 mb-6">
          <Info size={16} className="text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">
            Documents shared with you are{" "}
            <span className="text-foreground font-medium">view-only</span>. You
            must verify your identity by signing before accessing each document.
          </p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !shares || shares.length === 0 ? (
        <div className="space-y-8">
          <div className="border border-dashed border-border rounded-2xl p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Inbox size={32} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No documents shared with you yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              When an owner grants you access to a document, it will appear
              here. You'll need to verify your identity to view each document.
            </p>
          </div>

          {/* How It Works */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                How It Works
              </p>
              <div className="flex-1 border-t border-border" />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  step: "1",
                  title: "Creator Mints",
                  desc: "A creator tokenizes a document as an NFT on-chain.",
                  color: "bg-primary/15 text-primary",
                },
                {
                  step: "2",
                  title: "Owner Shares",
                  desc: "The document owner grants you viewer access from their dashboard.",
                  color: "bg-secondary/15 text-secondary",
                },
                {
                  step: "3",
                  title: "You Sign & View",
                  desc: "You verify your identity with a wallet signature and access the document.",
                  color: "bg-success/15 text-success",
                },
              ].map(({ step, title, desc, color }) => (
                <div
                  key={step}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3 ${color}`}
                  >
                    {step}
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shares.map((share) => {
            const doc = share.document;
            return (
              <div
                key={share.id}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
              >
                <FilePreview
                  fileType={doc.fileType}
                  fileUrl={doc.fileUrl}
                  className="h-40 w-full"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <CategoryBadge category={doc.category} />
                    <StatusBadge status={doc.status} />
                  </div>
                  <h3 className="text-foreground font-semibold mb-2 text-sm leading-snug">
                    {doc.title}
                  </h3>
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-muted-foreground">
                      By: {doc.creator?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      Owner:{" "}
                      <WalletAddress
                        address={doc.ownerWallet}
                        showCopy={false}
                      />
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <Clock size={11} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Shared{" "}
                        {new Date(share.grantedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Signature badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-muted text-muted-foreground border-border">
                      <CheckCircle size={10} />
                      Awaiting Signature
                    </span>
                  </div>

                  <Link to={`/viewer/document/${doc.id}`}>
                    <Button className="w-full gradient-primary text-primary-foreground rounded-xl glow-primary text-sm">
                      View Document
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
