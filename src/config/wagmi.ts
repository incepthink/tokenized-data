import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "NexVault",
  projectId: "nexvault-demo-project-id",
  chains: [baseSepolia],
  ssr: false,
});
