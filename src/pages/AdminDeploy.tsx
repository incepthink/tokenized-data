// One-off admin page: deploys contracts/document_vault.compact to Midnight with
// the connected wallet and shows the address to put in
// VITE_MIDNIGHT_CONTRACT_ADDRESS. Not linked from the app.

import { useState } from "react";
import { useMidnightWalletContext } from "@/context/MidnightWalletContext";
import { WalletGate } from "@/components/WalletGate";
import { Button } from "@/components/ui/button";
import { deployVault, describeVaultError } from "@/lib/midnight/vault";
import { CONTRACT_ADDRESS, MIDNIGHT_NETWORK } from "@/lib/midnight/config";

export default function AdminDeploy() {
  const { isConnected, connectedAPI, network, walletName, canProve } = useMidnightWalletContext();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ contractAddress: string; txHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isConnected || !connectedAPI) return <WalletGate />;

  const deploy = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await deployVault(connectedAPI));
    } catch (err) {
      console.error("[NexVault] deploy failed:", err);
      setError(describeVaultError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-xl w-full space-y-4">
        <h1 className="text-xl font-bold text-foreground">Deploy the NexVault contract</h1>
        <dl className="text-sm text-muted-foreground space-y-1">
          <div>Target network: <span className="text-foreground font-mono">{MIDNIGHT_NETWORK}</span></div>
          <div>Wallet: <span className="text-foreground">{walletName}</span> on <span className="text-foreground font-mono">{network}</span></div>
          <div>Proving: <span className="text-foreground">{canProve ? "in the wallet" : "local proof server on port 6300"}</span></div>
          <div className="break-all">Configured contract: <span className="text-foreground font-mono">{CONTRACT_ADDRESS || "none"}</span></div>
        </dl>
        <Button onClick={deploy} disabled={busy} className="w-full gradient-primary text-primary-foreground rounded-xl">
          {busy ? "Deploying… approve in your wallet" : "Deploy new contract"}
        </Button>
        {error && <p className="text-destructive text-sm break-words">{error}</p>}
        {result && (
          <div className="bg-card-elevated border border-border rounded-xl p-4 text-sm space-y-2">
            <p className="text-foreground font-medium">Deployed.</p>
            <p className="text-muted-foreground">Contract address</p>
            <p id="deployed-address" className="text-primary font-mono break-all">{result.contractAddress}</p>
            <p className="text-muted-foreground">Transaction</p>
            <p className="text-primary font-mono break-all">{result.txHash}</p>
          </div>
        )}
      </div>
    </div>
  );
}
