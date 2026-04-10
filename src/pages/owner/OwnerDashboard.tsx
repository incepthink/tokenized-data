import { useState } from "react";
import { Link } from "react-router-dom";
import { useDocuments } from "@/hooks/useDocuments";
import { CardSkeleton } from "@/components/SkeletonShimmer";
import { CategoryBadge, NftBadge } from "@/components/Badges";
import { FilePreview } from "@/components/FilePreview";
import { EmptyState } from "@/components/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen } from "lucide-react";
import type { ApiDocument } from "@/api/documents";

export default function OwnerDashboard() {
  const { data: rawDocs, isLoading } = useDocuments();
  const [sortBy, setSortBy] = useState("newest");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  let docs: ApiDocument[] = rawDocs ? [...rawDocs] : [];
  if (filterCategory !== "all")
    docs = docs.filter((d) => d.category === filterCategory);
  if (sortBy === "newest")
    docs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">My Documents</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Documents minted to your wallet by verified creators
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 bg-card-elevated border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="newest" className="text-foreground">
              Newest First
            </SelectItem>
            <SelectItem value="oldest" className="text-foreground">
              Oldest First
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 bg-card-elevated border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-foreground">
              All Categories
            </SelectItem>
            {[
              "Contract",
              "Report",
              "Certificate",
              "Invoice",
              "Dataset",
              "Other",
            ].map((c) => (
              <SelectItem key={c} value={c} className="text-foreground">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={48} />}
          title="No documents yet"
          description="Documents minted to your wallet will appear here."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <Link key={doc.id} to={`/owner/document/${doc.id}`}>
              <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors cursor-pointer group">
                <FilePreview
                  fileType={doc.fileType}
                  fileUrl={doc.fileUrl}
                  className="w-full h-40"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryBadge category={doc.category} />
                    <NftBadge />
                  </div>
                  <h3 className="text-foreground font-semibold mb-1 group-hover:text-primary transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1">
                    By: {doc.creator?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
