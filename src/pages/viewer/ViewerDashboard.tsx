import { Link } from "react-router-dom";
import { useViewerDocuments } from "@/hooks/useViewers";
import { CardSkeleton } from "@/components/SkeletonShimmer";
import { CategoryBadge, StatusBadge } from "@/components/Badges";
import { WalletAddress } from "@/components/WalletAddress";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";

export default function ViewerDashboard() {
  const { data: shares, isLoading } = useViewerDocuments();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">
        Shared With Me
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        Documents that owners have granted you access to
      </p>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !shares || shares.length === 0 ? (
        <EmptyState
          icon={<Inbox size={48} />}
          title="No documents shared with you yet"
          description="Documents shared with you will appear here."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shares.map((share) => {
            const doc = share.document;
            return (
              <div
                key={share.id}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CategoryBadge category={doc.category} />
                  <StatusBadge status={doc.status} />
                </div>
                <h3 className="text-foreground font-semibold mb-2">
                  {doc.title}
                </h3>
                <div className="space-y-1 mb-4">
                  <p className="text-xs text-muted-foreground">
                    Owner:{" "}
                    <WalletAddress address={doc.ownerWallet} showCopy={false} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    By: {doc.creator?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Shared: {new Date(share.grantedAt).toLocaleDateString()}
                  </p>
                </div>
                <Link to={`/viewer/document/${doc.id}`}>
                  <Button className="w-full gradient-primary text-primary-foreground rounded-xl glow-primary">
                    View Document
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
