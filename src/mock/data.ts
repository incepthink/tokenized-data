export const MOCK_USERS = {
  creator: {
    id: "cre_001",
    name: "Apex Data Labs",
    email: "admin@apexdata.io",
  },
  owner: {
    id: "own_001",
    name: "Jordan Blake",
    email: "jordan@nexvault.io",
    wallet: "0x742d35Cc6634C0532925a3b8D4C9fD2C68f8E123",
  },
  viewer: {
    id: "view_001",
    name: "Meridian Analytics",
    email: "ops@meridian.io",
    wallet: "0x9876dcba5432dcba9876dcba5432dcba9876dcba",
  },
};

export const MOCK_COLLECTIONS = [
  {
    id: "col_001",
    name: "Legal Documents",
    creatorId: "cre_001",
    documentCount: 3,
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "col_002",
    name: "Financial Reports",
    creatorId: "cre_001",
    documentCount: 2,
    createdAt: "2026-02-15T10:00:00Z",
  },
  {
    id: "col_003",
    name: "Compliance Certificates",
    creatorId: "cre_001",
    documentCount: 1,
    createdAt: "2026-03-01T10:00:00Z",
  },
];

export const MOCK_DOCUMENTS = [
  {
    id: "doc_001",
    collectionId: "col_001",
    title: "Service Agreement 2026",
    description:
      "Master service agreement between Apex Data Labs and Jordan Blake covering data processing, SLAs, and IP rights for the 2026 fiscal year.",
    category: "Contract" as const,
    creatorName: "Apex Data Labs",
    creatorId: "cre_001",
    ownerWallet: "0x742d35Cc6634C0532925a3b8D4C9fD2C68f8E123",
    fileType: "pdf" as const,
    fileUrl: "https://placehold.co/600x800/1E2535/6366F1?text=PDF+Document",
    tokenId: "2041",
    contractAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    txHash:
      "0xabc123def456789abc123def456789abc123def456789abc123def456789abc1",
    createdAt: "2026-03-01T09:30:00Z",
    status: "minted" as const,
  },
  {
    id: "doc_002",
    collectionId: "col_002",
    title: "Q1 2026 Financial Summary",
    description:
      "Quarterly financial performance report including revenue breakdown, operating margins, and year-over-year comparisons for Q1 2026.",
    category: "Report" as const,
    creatorName: "Apex Data Labs",
    creatorId: "cre_001",
    ownerWallet: "0x742d35Cc6634C0532925a3b8D4C9fD2C68f8E123",
    fileType: "image" as const,
    fileUrl: "https://placehold.co/600x400/1E2535/8B5CF6?text=Financial+Report",
    tokenId: "2042",
    contractAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    txHash:
      "0xdef456abc789def456abc789def456abc789def456abc789def456abc789def4",
    createdAt: "2026-03-05T14:15:00Z",
    status: "minted" as const,
  },
  {
    id: "doc_003",
    collectionId: "col_003",
    title: "ISO 27001 Compliance Certificate",
    description:
      "Information security management certification confirming compliance with ISO 27001 standards. Valid through December 2026.",
    category: "Certificate" as const,
    creatorName: "Apex Data Labs",
    creatorId: "cre_001",
    ownerWallet: "0x742d35Cc6634C0532925a3b8D4C9fD2C68f8E123",
    fileType: "docx" as const,
    fileUrl: null,
    tokenId: "2043",
    contractAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    txHash:
      "0xghi789jkl012ghi789jkl012ghi789jkl012ghi789jkl012ghi789jkl012ghi7",
    createdAt: "2026-03-08T11:00:00Z",
    status: "minted" as const,
  },
];

export const MOCK_VIEWERS = [
  {
    id: "view_001",
    name: "Meridian Analytics",
    wallet: "0x9876dcba5432dcba9876dcba5432dcba9876dcba",
  },
  {
    id: "view_002",
    name: "Orion Capital Group",
    wallet: "0x1234abcd5678efgh1234abcd5678efgh1234abcd",
  },
  {
    id: "view_003",
    name: "Nexus Compliance Ltd",
    wallet: "0xabcd1234efgh5678abcd1234efgh5678abcd1234",
  },
  {
    id: "view_004",
    name: "Summit Audit Bureau",
    wallet: "0xefgh5678ijkl9012efgh5678ijkl9012efgh5678",
  },
];

export const MOCK_SHARED_WITH: Record<
  string,
  {
    viewerId: string;
    viewerName: string;
    viewerWallet: string;
    grantedAt: string;
  }[]
> = {
  doc_001: [
    {
      viewerId: "view_001",
      viewerName: "Meridian Analytics",
      viewerWallet: "0x9876dcba5432dcba9876dcba5432dcba9876dcba",
      grantedAt: "2026-03-10T10:00:00Z",
    },
  ],
  doc_002: [],
  doc_003: [],
};

export const MOCK_ACCESS_LOGS: Record<
  string,
  {
    id: string;
    viewerName: string;
    viewerWallet: string;
    accessedAt: string;
    signatureHash: string;
  }[]
> = {
  doc_001: [
    {
      id: "log_001",
      viewerName: "Meridian Analytics",
      viewerWallet: "0x9876dcba5432dcba9876dcba5432dcba9876dcba",
      accessedAt: "2026-03-11T14:22:00Z",
      signatureHash: "0xsig123abc456def789sig123abc456def789sig123",
    },
  ],
  doc_002: [],
  doc_003: [],
};

export const MOCK_SHARED_WITH_VIEWER = [
  {
    documentId: "doc_001",
    title: "Service Agreement 2026",
    category: "Contract" as const,
    ownerWallet: "0x742d35Cc6634C0532925a3b8D4C9fD2C68f8E123",
    creatorName: "Apex Data Labs",
    sharedAt: "2026-03-10T10:00:00Z",
    signed: false,
  },
];

export type DocumentCategory =
  | "Contract"
  | "Report"
  | "Certificate"
  | "Invoice"
  | "Dataset"
  | "Other";
export type FileType = "pdf" | "image" | "docx";
export type DocumentStatus = "minted" | "pending";
export type Persona = "creator" | "owner" | "viewer";

export interface MockDocument {
  id: string;
  collectionId: string;
  title: string;
  description: string;
  category: DocumentCategory;
  creatorName: string;
  creatorId: string;
  ownerWallet: string;
  fileType: FileType;
  fileUrl: string | null;
  tokenId: string;
  contractAddress: string;
  txHash: string;
  createdAt: string;
  status: DocumentStatus;
}

export interface MockCollection {
  id: string;
  name: string;
  creatorId: string;
  documentCount: number;
  createdAt: string;
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function simulateDelay(ms?: number): Promise<void> {
  const delay = ms ?? 600 + Math.random() * 300;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  Contract: "bg-primary/20 text-primary border-primary/30",
  Report: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Certificate: "bg-success/20 text-success border-success/30",
  Invoice: "bg-warning/20 text-warning border-warning/30",
  Dataset: "bg-secondary/20 text-secondary border-secondary/30",
  Other: "bg-muted/20 text-muted-foreground border-muted/30",
};
