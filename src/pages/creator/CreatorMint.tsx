import { useState, useCallback, useEffect } from "react";
import { DocumentCategory } from "@/mock/data";
import { useCollections, useCreateCollection } from "@/hooks/useCollections";
import { useCreateDocument, useMintDocument } from "@/hooks/useDocuments";
import type { CreateDocumentPayload } from "@/api/documents";
import { useMidnightWalletContext } from "@/context/MidnightWalletContext";
import {
  callCreateCollection,
  callMintDocument,
  decodeShieldedAddress,
  CONTRACT_ADDRESS,
} from "@/lib/midnight/contractApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
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
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { axiosInstance, axiosInstanceImage } from "@/lib/axios";
import { cn } from "@/lib/utils";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import type { FileType } from "@/mock/data";

function deriveFileType(file: File): FileType {
  if (file.name.match(/\.pdf$/i)) return "pdf";
  if (file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "image";
  return "docx";
}

const isValidMidnightAddress = (addr: string) =>
  addr.trim().length >= 60 && !addr.startsWith("0x");

export default function CreatorMint() {
  const { data: collections } = useCollections();
  const createCollection = useCreateCollection();
  const createDocument = useCreateDocument();
  const mintDocument = useMintDocument();
  const { connectedAPI, address } = useMidnightWalletContext();

  const [collectionId, setCollectionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [ownerWallet, setOwnerWallet] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mintedFileUrl, setMintedFileUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [minting, setMinting] = useState(false);
  const [mintedTxHash, setMintedTxHash] = useState<string | null>(null);
  const [newColName, setNewColName] = useState("");
  const [newColOpen, setNewColOpen] = useState(false);
  const [ownerEmails, setOwnerEmails] = useState<string[]>([]);
  const [ownerEmailsLoading, setOwnerEmailsLoading] = useState(false);
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState("");
  const [emailPopoverOpen, setEmailPopoverOpen] = useState(false);

  useEffect(() => {
    setSelectedOwnerEmail("");
    setOwnerEmails([]);
    if (!isValidMidnightAddress(ownerWallet)) return;
    const timer = setTimeout(async () => {
      setOwnerEmailsLoading(true);
      try {
        const { data } = await axiosInstance.get<{
          owners: { email: string }[];
        }>(`/documents/owners/${ownerWallet.trim()}`);
        setOwnerEmails(data.owners.map((o) => o.email));
      } catch {
        setOwnerEmails([]);
      } finally {
        setOwnerEmailsLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [ownerWallet]);

  const isImageFile = (f: File) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name);

  const setFileWithPreview = useCallback((f: File) => {
    setFile(f);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return isImageFile(f) ? URL.createObjectURL(f) : null;
    });
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
        if (!isImageFile(f)) {
          toast.error("Only image files are accepted (JPG, PNG, GIF, WEBP)");
          return;
        }
        if (f.size > 10 * 1024 * 1024) {
          toast.error("File must be under 10MB");
          return;
        }
        setFileWithPreview(f);
      }
    },
    [setFileWithPreview],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (!f) return;
      if (!isImageFile(f)) {
        toast.error("Only image files are accepted (JPG, PNG, GIF, WEBP)");
        return;
      }
      if (f.size <= 10 * 1024 * 1024) setFileWithPreview(f);
    },
    [setFileWithPreview],
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!collectionId) errs.collection = "Select a collection";
    if (!title.trim()) errs.title = "Title is required";
    if (!description.trim()) errs.description = "Description is required";
    if (!category) errs.category = "Select a category";
    if (!ownerWallet.trim()) errs.ownerWallet = "Owner wallet is required";
    else if (ownerWallet.startsWith("0x"))
      errs.ownerWallet =
        "Must be a Midnight unshielded address, not an Ethereum address";
    else if (ownerWallet.trim().length < 60)
      errs.ownerWallet = "Enter a valid Midnight unshielded address";
    if (isValidMidnightAddress(ownerWallet) && !selectedOwnerEmail)
      errs.ownerEmail = "Select an owner email address";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setMinting(true);
    try {
      let uploadedImageUrl: string | undefined;
      if (file) {
        const imgForm = new FormData();
        imgForm.append("image", file);
        const { data: uploadData } = await axiosInstanceImage.post<{
          success: boolean;
          imageUrl: string;
          ipfsHash: string;
        }>("/platform/upload/image", imgForm);
        uploadedImageUrl = uploadData.imageUrl;
      }

      const payload: CreateDocumentPayload = {
        collectionId,
        title,
        description,
        category: category as DocumentCategory,
        ownerWallet,
        ownerEmail: selectedOwnerEmail,
        fileType: file ? deriveFileType(file) : "pdf",
        ...(uploadedImageUrl ? { fileUrl: uploadedImageUrl } : {}),
      };

      const doc = await createDocument.mutateAsync(payload);
      setMintedFileUrl(doc.fileUrl ?? uploadedImageUrl ?? null);

      let txHash = "0x" + Math.random().toString(16).slice(2).padEnd(64, "0");
      let contractAddress = CONTRACT_ADDRESS;
      let tokenId = 0;
      let onchainTokenId: string | undefined;
      console.log(connectedAPI);

      if (connectedAPI && address) {
        try {
          const fileBytes = file
            ? new Uint8Array(await file.arrayBuffer())
            : new Uint8Array(0);
          const docHashBuf = await crypto.subtle.digest("SHA-256", fileBytes);
          const docHash = new Uint8Array(docHashBuf);

          const metaStr = `${title}|${category}|${description}`;
          const metaHashBuf = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(metaStr),
          );
          const metaHash = new Uint8Array(metaHashBuf);

          const { shieldedAddress: creatorShieldedAddr } =
            await connectedAPI.getShieldedAddresses();
          const creatorPk = decodeShieldedAddress(creatorShieldedAddr);
          const ownerPk = decodeShieldedAddress(ownerWallet);

          const selectedCollection = collections?.find(
            (c) => c.id === collectionId,
          );
          const onchainCollectionId = selectedCollection?.onchainCollectionId
            ? BigInt(selectedCollection.onchainCollectionId)
            : BigInt(0);

          const result = await callMintDocument(connectedAPI, {
            docHash,
            metaHash,
            ownerPk,
            creatorPk,
            onchainCollectionId,
          });

          txHash = result.txId;
          onchainTokenId = result.onchainTokenId.toString();
        } catch (err) {
          console.log("On-chain minting failed, continuing with backend:", err);
        }
      }

      await mintDocument.mutateAsync({
        id: doc.id,
        tokenId,
        contractAddress,
        txHash,
        onchainTokenId,
      });

      setMintedTxHash(txHash);
      toast.success("Document minted successfully!");
    } catch (err) {
      toast.error("Minting failed. Please try again.");
      console.log(err);
    } finally {
      setMinting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setOwnerWallet("");
    setSelectedOwnerEmail("");
    setOwnerEmails([]);
    setFile(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMintedFileUrl(null);
    setMintedTxHash(null);
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
          Minting on Midnight Preprod...
        </h2>
        <p className="text-muted-foreground text-sm">
          Creating a unique NFT for your document
        </p>
      </div>
    );
  }

  if (mintedTxHash) {
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
          {collections?.find((c) => c.id === collectionId)?.name ||
            "Collection"}
        </p>
        {/* {mintedFileUrl && (
          <img
            src={`http://localhost:5000${mintedFileUrl}`}
            alt="Minted document"
            className="h-36 rounded-xl object-cover border border-border shadow mb-4"
          />
        )} */}
        <div className="bg-card border border-border rounded-xl px-4 py-2 mb-6 max-w-sm w-full">
          <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
          <p className="text-primary text-xs font-mono break-all">
            {mintedTxHash}
          </p>
        </div>
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
      {/* Workflow context banner */}
      {/* <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3 mb-6">
        <Info size={16} className="text-primary shrink-0" />
        <div className="flex-1 text-sm">
          <span className="text-muted-foreground">Step 2 of 3 — </span>
          <span className="font-medium text-foreground">
            Minting a Document
          </span>
        </div>
        <Link
          to="/creator/collections"
          className="text-xs text-primary underline underline-offset-2 shrink-0"
        >
          ← Manage Collections
        </Link>
      </div> */}

      <h1 className="text-2xl font-bold text-foreground mb-1">
        Mint New Document
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Upload a file and fill in the details below. The document is hashed,
        tokenized as an NFT, and the owner's wallet receives access on Midnight
        Preprod.
      </p>

      {/* Section label: Choose Collection */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
          1 · Choose Collection
        </span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Collection selector */}
      <div className="flex items-end gap-3 mb-6">
        <div className="flex-1">
          <Label className="text-foreground">Collection</Label>
          <Select value={collectionId} onValueChange={setCollectionId}>
            <SelectTrigger className="bg-card-elevated border-border text-foreground mt-1">
              <SelectValue placeholder="Select Collection" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {collections?.map((c) => (
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
                disabled={createCollection.isPending}
                onClick={async () => {
                  if (!newColName.trim()) return;
                  try {
                    let onchainCollectionId: string | undefined;
                    if (connectedAPI && address) {
                      const { shieldedAddress: creatorShieldedAddr } =
                        await connectedAPI.getShieldedAddresses();
                      const creatorPk =
                        decodeShieldedAddress(creatorShieldedAddr);
                      const result = await callCreateCollection(
                        connectedAPI,
                        creatorPk,
                      );
                      onchainCollectionId =
                        result.onchainCollectionId.toString();
                      toast.info(
                        `Collection registered on-chain (tx: ${result.txId.slice(0, 10)}…)`,
                      );
                    }
                    const col = await createCollection.mutateAsync({
                      name: newColName,
                      onchainCollectionId,
                    });
                    setCollectionId(col.id);
                    toast.success(`Collection "${newColName}" created`);
                    setNewColName("");
                    setNewColOpen(false);
                  } catch {
                    toast.error("Failed to create collection");
                  }
                }}
                className="w-full gradient-primary text-primary-foreground rounded-xl"
              >
                {createCollection.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Section label: Document Details */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
          2 · Document Details
        </span>
        <div className="flex-1 border-t border-border" />
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
            {/* <Tooltip>
              <TooltipTrigger>
                <Info size={14} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="bg-card-elevated border-border text-foreground max-w-xs">
                The recipient's Midnight unshielded address on Midnight Preprod.
                They will receive access to this document.
              </TooltipContent>
            </Tooltip> */}
          </div>
          <Input
            value={ownerWallet}
            onChange={(e) => setOwnerWallet(e.target.value)}
            placeholder="Midnight unshielded address"
            className="bg-card-elevated border-border text-foreground mt-1 font-mono"
          />
          {errors.ownerWallet && (
            <p className="text-destructive text-xs mt-1">
              {errors.ownerWallet}
            </p>
          )}
        </div>

        {isValidMidnightAddress(ownerWallet) && (
          <div>
            <Label className="text-foreground">Owner Email Address</Label>
            <Popover open={emailPopoverOpen} onOpenChange={setEmailPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={emailPopoverOpen}
                  disabled={
                    ownerEmailsLoading ||
                    (!ownerEmailsLoading && ownerEmails.length === 0)
                  }
                  className={cn(
                    "w-full mt-1 justify-between bg-card-elevated border-border text-foreground font-normal",
                    !selectedOwnerEmail && "text-muted-foreground",
                  )}
                >
                  {ownerEmailsLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Looking up owners...
                    </span>
                  ) : selectedOwnerEmail ? (
                    selectedOwnerEmail
                  ) : ownerEmails.length === 0 ? (
                    "No owners found for this wallet"
                  ) : (
                    "Select owner email"
                  )}
                  {!ownerEmailsLoading && (
                    <ChevronsUpDown
                      size={14}
                      className="ml-2 shrink-0 opacity-50"
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0 bg-card border-border"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search emails..."
                    className="text-foreground"
                  />
                  <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                    No matching emails
                  </CommandEmpty>
                  <CommandGroup>
                    {ownerEmails.map((email) => (
                      <CommandItem
                        key={email}
                        value={email}
                        onSelect={() => {
                          setSelectedOwnerEmail(email);
                          setEmailPopoverOpen(false);
                        }}
                        className="text-foreground cursor-pointer"
                      >
                        <Check
                          size={14}
                          className={cn(
                            "mr-2",
                            selectedOwnerEmail === email
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {email}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.ownerEmail && (
              <p className="text-destructive text-xs mt-1">
                {errors.ownerEmail}
              </p>
            )}
          </div>
        )}

        {/* Section label: Attach File */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
            3 · Attach File
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* File Upload */}
        <div>
          <Label className="text-foreground">File Upload</Label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative mt-1 border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/60 transition-colors bg-card-elevated/30"
          >
            {file && imagePreview ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={imagePreview}
                  alt={file.name}
                  className="h-40 max-w-full rounded-xl object-cover border border-border shadow"
                />
                <div className="text-center">
                  <p className="text-foreground text-sm font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
                  </p>
                </div>
              </div>
            ) : file ? (
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
                  JPG, PNG, GIF, WEBP · Only images accepted for now · Max 10MB
                </p>
              </>
            )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full gradient-primary text-primary-foreground font-semibold py-6 rounded-xl glow-primary hover:glow-primary-strong text-base"
        >
          Mint Document
        </Button>
        <div className="flex gap-6 justify-center">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle size={12} className="text-success/70" /> File hashed
            on-chain
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText size={12} className="text-primary/70" /> NFT record
            created
          </span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Minting creates a unique tokenized record on Midnight Preprod.
        </p>
      </form>
    </div>
  );
}
