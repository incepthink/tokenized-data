import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocuments,
  getDocument,
  createDocument,
  deleteDocument,
  mintDocument,
  type CreateDocumentPayload,
} from "@/api/documents";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: () => getDocument(id),
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDocumentPayload) => createDocument(payload),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["collections", doc.collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useMintDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      tokenId,
      contractAddress,
      txHash,
      onchainTokenId,
    }: {
      id: string;
      tokenId: number;
      contractAddress: string;
      txHash: string;
      onchainTokenId?: string;
    }) => mintDocument(id, { tokenId, contractAddress, txHash, onchainTokenId }),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["documents", doc.id] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
