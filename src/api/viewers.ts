import { axiosInstance } from "@/lib/axios";
import type { ViewerShare } from "./sharing";

export interface ViewerUser {
  id: string;
  name: string;
  email: string;
  wallet: string | null;
}

export async function listViewers(): Promise<ViewerUser[]> {
  const { data } = await axiosInstance.get<ViewerUser[]>("/viewers");
  return data;
}

export async function getViewerDocuments(): Promise<ViewerShare[]> {
  const { data } = await axiosInstance.get<ViewerShare[]>("/viewers/documents");
  return data;
}
