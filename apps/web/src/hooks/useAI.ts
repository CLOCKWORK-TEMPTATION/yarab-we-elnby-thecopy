import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useChatWithAI() {
  return useMutation({
    mutationFn: ({
      message,
      history,
    }: {
      message: string;
      history: Array<{ role: string; content: string }>;
    }) => api.chatWithAI(message, undefined, { history }),
  });
}

export function useGetShotSuggestion() {
  return useMutation({
    mutationFn: ({
      projectId,
      sceneId,
      shotType,
    }: {
      projectId: string;
      sceneId: string;
      shotType: string;
    }) => api.getShotSuggestion(projectId, sceneId, shotType),
  });
}
