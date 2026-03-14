import { Shield } from "lucide-react";

export function NexVaultLogo({ size = "default" }: { size?: "default" | "large" }) {
  const iconSize = size === "large" ? 32 : 24;
  const textClass = size === "large" ? "text-2xl" : "text-xl";

  return (
    <div className="flex items-center gap-2">
      <div className="gradient-primary p-1.5 rounded-lg glow-primary">
        <Shield size={iconSize} className="text-primary-foreground" />
      </div>
      <span className={`font-bold tracking-tight text-foreground ${textClass}`}>
        NexVault
      </span>
    </div>
  );
}
