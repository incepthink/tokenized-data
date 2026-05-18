import { NexVaultLogo } from "@/components/NexVaultLogo";
// import { ConnectButton } from "@rainbow-me/rainbowkit"; // Replaced by 1AM Midnight Wallet
import { MidnightConnectButton } from "@/components/MidnightConnectButton";
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
          Connect your Lace or 1AM Midnight Wallet to continue with NexVault — a blockchain-powered platform for tokenized document exchange on Midnight.
        </p>
        <div className="flex flex-col items-center gap-4 w-full">
          <MidnightConnectButton walletType="lace" />
          <span className="text-xs text-muted-foreground">or</span>
          <MidnightConnectButton walletType="oneam" />
        </div>
      </div>
    </div>
  );
}
