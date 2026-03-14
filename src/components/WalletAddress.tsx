import { truncateAddress } from "@/mock/data";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function WalletAddress({
  address,
  showCopy = true,
}: {
  address: string;
  showCopy?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground group">
      {truncateAddress(address)}
      {showCopy && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check size={14} className="text-success" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      )}
    </span>
  );
}
