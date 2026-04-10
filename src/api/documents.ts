import { axiosInstance } from "@/lib/axios";
import type { DocumentCategory, FileType, DocumentStatus } from "@/mock/data";

export interface ApiDocument {
  id: string;
  collectionId: string;
  title: string;
  description: string | null;
  category: DocumentCategory;
  fileType: FileType;
  fileUrl: string | null;
  status: DocumentStatus;
  ownerWallet: string;
  tokenId: number | null;
  contractAddress: string | null;
  txHash: string | null;
  onchainTokenId: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  collection?: { id: string; name: string };
  creator?: { id: string; name: string };
}

export async function getDocuments(): Promise<ApiDocument[]> {
  const { data } = await axiosInstance.get<ApiDocument[]>("/documents");
  return data;
}

export async function getDocument(id: string): Promise<ApiDocument> {
  const { data } = await axiosInstance.get<ApiDocument>(`/documents/${id}`);
  return data;
}

export async function createDocument(formData: FormData): Promise<ApiDocument> {
  const { data } = await axiosInstance.post<ApiDocument>("/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await axiosInstance.delete(`/documents/${id}`);
}

export async function mintDocument(
  id: string,
  payload: { tokenId: number; contractAddress: string; txHash: string; onchainTokenId?: string }
): Promise<ApiDocument> {
  const { data } = await axiosInstance.patch<ApiDocument>(`/documents/${id}/mint`, payload);
  return data;
}
