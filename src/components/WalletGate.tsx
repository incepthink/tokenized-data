import { NexVaultLogo } from "@/components/NexVaultLogo";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Shield } from "lucide-react";

export function WalletGate() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 max-w-md w-full text-center animate-pulse-glow">
        <div className="flex justify-center mb-6">
          <NexVaultLogo size="large" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground text-sm mb-8">
          Connect your wallet to continue with NexVault — a blockchain-powered platform for tokenized document exchange on Base.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    </div>
  );
}
