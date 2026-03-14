import { DocumentCategory, CATEGORY_COLORS } from "@/mock/data";

export function CategoryBadge({ category }: { category: DocumentCategory }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[category]}`}>
      {category}
    </span>
  );
}

export function NftBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30 glow-primary">
      NFT
    </span>
  );
}

export function StatusBadge({ status }: { status: "minted" | "pending" | "Signed" | "Requires Signature" }) {
  const styles = {
    minted: "bg-success/20 text-success border-success/30",
    pending: "bg-warning/20 text-warning border-warning/30",
    "Signed": "bg-success/20 text-success border-success/30",
    "Requires Signature": "bg-warning/20 text-warning border-warning/30",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status === "minted" ? "Minted" : status === "pending" ? "Pending" : status}
    </span>
  );
}
