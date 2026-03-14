import { useState, useCallback } from "react";
import { MOCK_COLLECTIONS, DocumentCategory } from "@/mock/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  CheckCircle,
  Loader2,
  Info,
  Plus,
  FileText,
  Image,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CreatorMint() {
  const [collectionId, setCollectionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [ownerWallet, setOwnerWallet] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [minting, setMinting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColOpen, setNewColOpen] = useState(false);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
        if (f.size > 10 * 1024 * 1024) {
          toast.error("File must be under 10MB");
          return;
        }
        setFile(f);
      }
    },
    [],
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.size <= 10 * 1024 * 1024) setFile(f);
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!collectionId) errs.collection = "Select a collection";
    if (!title.trim()) errs.title = "Title is required";
    if (!description.trim()) errs.description = "Description is required";
    if (!category) errs.category = "Select a category";
    if (!ownerWallet.trim()) errs.ownerWallet = "Owner wallet is required";
    if (!ownerWallet.startsWith("0x"))
      errs.ownerWallet = "Must be a valid Ethereum address";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setMinting(true);
    setTimeout(() => {
      setMinting(false);
      setSuccess(true);
      toast.success("Document minted successfully!");
    }, 2500);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setOwnerWallet("");
    setFile(null);
    setSuccess(false);
  };

  const getFileIcon = (name: string) => {
    if (name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
      return <Image size={20} className="text-secondary" />;
    if (name.match(/\.pdf$/i))
      return <FileText size={20} className="text-destructive" />;
    return <FileSpreadsheet size={20} className="text-blue-400" />;
  };

  if (minting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow rounded-full p-8 mb-6">
          <Loader2 size={48} className="text-primary animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Minting on Base Sepolia...
        </h2>
        <p className="text-muted-foreground text-sm">
          Creating a unique NFT for your document
        </p>
      </div>
    );
  }

  if (success) {
    const txHash =
      "0xabc123def456789abc123def456789abc123def456789abc123def456789abc1";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-checkmark mb-6">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center glow-primary-strong">
            <CheckCircle size={40} className="text-primary-foreground" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Document Minted Successfully
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Collection:{" "}
          {MOCK_COLLECTIONS.find((c) => c.id === collectionId)?.name ||
            "Collection"}
        </p>
        <a
          href={`https://sepolia.basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm hover:underline mb-6 font-mono"
        >
          {txHash.slice(0, 20)}...
        </a>
        <div className="flex gap-3">
          <Button
            onClick={resetForm}
            className="gradient-primary text-primary-foreground rounded-xl glow-primary"
          >
            Mint Another
          </Button>
          <Button
            variant="outline"
            className="border-border text-muted-foreground rounded-xl bg-transparent"
            onClick={() => window.history.back()}
          >
            View Collection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-1">
        Mint New Document
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        This document will be tokenized as an NFT and assigned to the owner's
        wallet on Base Sepolia.
      </p>

      {/* Collection selector */}
      <div className="flex items-end gap-3 mb-6">
        <div className="flex-1">
          <Label className="text-foreground">Collection</Label>
          <Select value={collectionId} onValueChange={setCollectionId}>
            <SelectTrigger className="bg-card-elevated border-border text-foreground mt-1">
              <SelectValue placeholder="Select Collection" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {MOCK_COLLECTIONS.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-foreground">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.collection && (
            <p className="text-destructive text-xs mt-1">{errors.collection}</p>
          )}
        </div>
        <Dialog open={newColOpen} onOpenChange={setNewColOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="border-border text-muted-foreground bg-transparent rounded-xl"
            >
              <Plus size={16} className="mr-1" /> New
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                New Collection
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="Collection name"
                className="bg-card-elevated border-border text-foreground"
              />
              <Button
                onClick={() => {
                  toast.success(`Collection "${newColName}" created`);
                  setNewColOpen(false);
                }}
                className="w-full gradient-primary text-primary-foreground rounded-xl"
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label className="text-foreground">Document Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q1 Financial Report"
            className="bg-card-elevated border-border text-foreground mt-1"
          />
          {errors.title && (
            <p className="text-destructive text-xs mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <Label className="text-foreground">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the content and purpose of this document..."
            className="bg-card-elevated border-border text-foreground mt-1 min-h-[100px]"
          />
          {errors.description && (
            <p className="text-destructive text-xs mt-1">
              {errors.description}
            </p>
          )}
        </div>

        <div>
          <Label className="text-foreground">Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as DocumentCategory)}
          >
            <SelectTrigger className="bg-card-elevated border-border text-foreground mt-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
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
          {errors.category && (
            <p className="text-destructive text-xs mt-1">{errors.category}</p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Label className="text-foreground">Owner Wallet Address</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info size={14} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="bg-card-elevated border-border text-foreground max-w-xs">
                The recipient's Ethereum wallet address on Base Sepolia. They
                will receive this document as an NFT.
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            value={ownerWallet}
            onChange={(e) => setOwnerWallet(e.target.value)}
            placeholder="0x..."
            className="bg-card-elevated border-border text-foreground mt-1 font-mono"
          />
          {errors.ownerWallet && (
            <p className="text-destructive text-xs mt-1">
              {errors.ownerWallet}
            </p>
          )}
        </div>

        {/* File Upload */}
        <div>
          <Label className="text-foreground">File Upload</Label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="mt-1 border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/60 transition-colors bg-card-elevated/30"
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                {getFileIcon(file.name)}
                <div className="text-left">
                  <p className="text-foreground text-sm font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={32} className="text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF, WEBP, PDF, DOCX · Max 10MB
                </p>
              </>
            )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              style={{ position: "relative" }}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full gradient-primary text-primary-foreground font-semibold py-6 rounded-xl glow-primary hover:glow-primary-strong text-base"
        >
          Mint Document
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Minting creates a unique NFT on Base Sepolia. Gas fees are handled by
          the platform.
        </p>
      </form>
    </div>
  );
}
