import { useQuery } from "@tanstack/react-query";
import { listViewers, getViewerDocuments } from "@/api/viewers";

export function useViewerList() {
  return useQuery({
    queryKey: ["viewer-list"],
    queryFn: listViewers,
  });
}

export function useViewerDocuments() {
  return useQuery({
    queryKey: ["viewer-documents"],
    queryFn: getViewerDocuments,
  });
}
