import { axiosInstance } from "@/lib/axios";

export interface ApiCollection {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  onchainCollectionId: string | null;
  createdAt: string;
  updatedAt: string;
  documents: { id: string }[];
}

export async function getCollections(): Promise<ApiCollection[]> {
  const { data } = await axiosInstance.get<ApiCollection[]>("/collections");
  return data;
}

export async function getCollection(id: string): Promise<ApiCollection> {
  const { data } = await axiosInstance.get<ApiCollection>(`/collections/${id}`);
  return data;
}

export async function createCollection(
  name: string,
  description?: string,
  onchainCollectionId?: string
): Promise<ApiCollection> {
  const { data } = await axiosInstance.post<ApiCollection>("/collections", { name, description, onchainCollectionId });
  return data;
}

export async function updateCollection(
  id: string,
  payload: { name?: string; description?: string }
): Promise<ApiCollection> {
  const { data } = await axiosInstance.put<ApiCollection>(`/collections/${id}`, payload);
  return data;
}

export async function deleteCollection(id: string): Promise<void> {
  await axiosInstance.delete(`/collections/${id}`);
}
