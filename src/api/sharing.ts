import { axiosInstance } from "@/lib/axios";
import type { ApiDocument } from "./documents";

export interface DocumentViewer {
  id: string;
  documentId: string;
  viewerId: string;
  grantedAt: string;
  createdAt: string;
  updatedAt: string;
  viewer: {
    id: string;
    name: string;
    email: string;
    wallet: string | null;
  };
}

export interface AccessLog {
  id: string;
  documentId: string;
  viewerId: string;
  viewerWallet: string;
  signatureHash: string;
  accessedAt: string;
  createdAt: string;
  updatedAt: string;
  viewer: { id: string; name: string };
}

export interface ViewerShare {
  id: string;
  documentId: string;
  viewerId: string;
  grantedAt: string;
  createdAt: string;
  updatedAt: string;
  document: ApiDocument;
}

export async function getDocumentViewers(documentId: string): Promise<DocumentViewer[]> {
  const { data } = await axiosInstance.get<DocumentViewer[]>(`/documents/${documentId}/viewers`);
  return data;
}

export async function grantAccess(documentId: string, viewerId: string): Promise<DocumentViewer> {
  const { data } = await axiosInstance.post<DocumentViewer>(`/documents/${documentId}/viewers`, {
    viewerId,
  });
  return data;
}

export async function revokeAccess(documentId: string, viewerId: string): Promise<void> {
  await axiosInstance.delete(`/documents/${documentId}/viewers/${viewerId}`);
}

export async function getAccessLogs(documentId: string): Promise<AccessLog[]> {
  const { data } = await axiosInstance.get<AccessLog[]>(`/documents/${documentId}/access-logs`);
  return data;
}

export async function signDocument(
  documentId: string,
  signatureHash: string
): Promise<AccessLog> {
  const { data } = await axiosInstance.post<AccessLog>(`/documents/${documentId}/sign`, {
    signatureHash,
  });
  return data;
}
