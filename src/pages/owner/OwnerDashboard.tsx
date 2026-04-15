import { useState } from "react";
import { Link } from "react-router-dom";
import { useDocuments } from "@/hooks/useDocuments";
import { CardSkeleton, StatSkeleton } from "@/components/SkeletonShimmer";
import { CategoryBadge, NftBadge } from "@/components/Badges";
import { FilePreview } from "@/components/FilePreview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, FileText, Eye, Info } from "lucide-react";
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

  const totalDocs = rawDocs?.length ?? 0;
  const uniqueCategories = new Set(rawDocs?.map((d) => d.category) ?? []).size;

  const stats = [
    {
      label: "Documents Received",
      value: totalDocs,
      icon: FileText,
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      accent: "border-b-primary/40",
    },
    {
      label: "Categories",
      value: uniqueCategories,
      icon: FolderOpen,
      iconBg: "bg-secondary/15",
      iconColor: "text-secondary",
      accent: "border-b-secondary/40",
    },
    {
      label: "Viewer Access",
      value: "—",
      icon: Eye,
      iconBg: "bg-success/15",
      iconColor: "text-success",
      accent: "border-b-success/40",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">My Documents</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Documents minted to your wallet by verified creators
      </p>

      {/* "How it works" banner — shown until user has documents */}
      {totalDocs === 0 && !isLoading && (
        <div className="bg-card border border-primary/20 rounded-2xl p-6 mb-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">
            How it works — your owner workflow
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">A Creator Mints to You</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  A verified Creator uploads a document and assigns it to your wallet address on the Midnight network.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary text-sm font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Open &amp; Grant Viewer Access</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Click any document to open it, then choose a registered Viewer from the dropdown to grant them access.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-success/20 text-success text-sm font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Track &amp; Revoke Anytime</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Every access event is logged on-chain. You can revoke a Viewer's access at any time from the document page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
              {s.label === "Viewer Access" && (
                <p className="text-xs text-muted-foreground/60 mt-0.5">manage per document</p>
              )}
            </div>
          ))
        )}
      </div>

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
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-border">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FolderOpen size={32} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No documents assigned yet
          </h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">
            Documents minted to your wallet by Creators will appear here automatically.
          </p>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3 max-w-sm w-full">
            <Info size={14} className="text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Ask a Creator to mint a document and enter your Midnight wallet address as the owner.
            </p>
          </div>
        </div>
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
