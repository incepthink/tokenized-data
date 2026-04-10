import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocumentViewers,
  grantAccess,
  revokeAccess,
  getAccessLogs,
  signDocument,
} from "@/api/sharing";

export function useDocumentViewers(documentId: string) {
  return useQuery({
    queryKey: ["viewers", documentId],
    queryFn: () => getDocumentViewers(documentId),
    enabled: !!documentId,
  });
}

export function useGrantAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, viewerId }: { documentId: string; viewerId: string }) =>
      grantAccess(documentId, viewerId),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ["viewers", documentId] });
    },
  });
}

export function useRevokeAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, viewerId }: { documentId: string; viewerId: string }) =>
      revokeAccess(documentId, viewerId),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ["viewers", documentId] });
    },
  });
}

export function useAccessLogs(documentId: string) {
  return useQuery({
    queryKey: ["access-logs", documentId],
    queryFn: () => getAccessLogs(documentId),
    enabled: !!documentId,
  });
}

export function useSignDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, signatureHash }: { documentId: string; signatureHash: string }) =>
      signDocument(documentId, signatureHash),
    onSuccess: (log) => {
      queryClient.invalidateQueries({ queryKey: ["access-logs", log.documentId] });
    },
  });
}
