import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
// import { WagmiProvider } from "wagmi";                          // Replaced by 1AM Midnight Wallet
// import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit"; // Replaced by 1AM Midnight Wallet
// import "@rainbow-me/rainbowkit/styles.css";                    // Replaced by 1AM Midnight Wallet
// import { config } from "@/config/wagmi";                       // Replaced by 1AM Midnight Wallet
import { MidnightWalletProvider } from "@/context/MidnightWalletContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import CreatorDashboard from "@/pages/creator/CreatorDashboard";
import CreatorCollections from "@/pages/creator/CreatorCollections";
import CreatorMint from "@/pages/creator/CreatorMint";
import OwnerDashboard from "@/pages/owner/OwnerDashboard";
import OwnerDocumentDetail from "@/pages/owner/OwnerDocumentDetail";
import ViewerDashboard from "@/pages/viewer/ViewerDashboard";
import ViewerDocumentDetail from "@/pages/viewer/ViewerDocumentDetail";

const queryClient = new QueryClient();

const App = () => (
  // <WagmiProvider config={config}>          {/* Replaced by 1AM Midnight Wallet */}
  <MidnightWalletProvider>
    <QueryClientProvider client={queryClient}>
      {/* <RainbowKitProvider                  Replaced by 1AM Midnight Wallet
        theme={darkTheme({
          accentColor: "#6366F1",
          accentColorForeground: "white",
          borderRadius: "large",
          fontStack: "system",
        })}
      > */}
      <AuthProvider>
        <TooltipProvider>
          <Sonner theme="dark" />
          <BrowserRouter basename="/examples/tokenized-data">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/:persona" element={<AuthPage />} />

              <Route element={<ProtectedRoute requiredPersona="creator" />}>
                <Route
                  path="/creator/dashboard"
                  element={<CreatorDashboard />}
                />
                <Route
                  path="/creator/collections"
                  element={<CreatorCollections />}
                />
                <Route path="/creator/mint" element={<CreatorMint />} />
              </Route>

              <Route element={<ProtectedRoute requiredPersona="owner" />}>
                <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                <Route
                  path="/owner/document/:id"
                  element={<OwnerDocumentDetail />}
                />
              </Route>

              <Route element={<ProtectedRoute requiredPersona="viewer" />}>
                <Route
                  path="/viewer/dashboard"
                  element={<ViewerDashboard />}
                />
                <Route
                  path="/viewer/document/:id"
                  element={<ViewerDocumentDetail />}
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
      {/* </RainbowKitProvider> */}
    </QueryClientProvider>
  </MidnightWalletProvider>
  // </WagmiProvider>
);

export default App;
