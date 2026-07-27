import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import {
  memberSchema,
  teamSchema,
  type InviteInput,
  type Member,
  type Team,
} from "./schema";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

const teamKeys = { all: ["team"] as const };

async function fetchTeam(signal?: AbortSignal): Promise<Team> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    return {
      members: [
        { id: "u1", email: "you@school.edu", name: "You", role: "teacher", status: "active" },
        { id: "u2", email: "colleague@school.edu", name: "A. Colleague", role: "teacher", status: "pending" },
      ],
    };
  }
  return api.get("/team", teamSchema, signal);
}

export function useTeam() {
  return useQuery({
    queryKey: teamKeys.all,
    queryFn: ({ signal }) => fetchTeam(signal),
  });
}

export function useInviteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InviteInput): Promise<Member> => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 300));
        return { id: "u_new", ...input, status: "pending" };
      }
      return api.post("/team/invite", input, memberSchema);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  });
}

const removeAckSchema = z.object({ removed: z.boolean() });

/** Revoke a pending invite or remove an active member (AGENTS §6). */
export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 300));
        return { removed: true };
      }
      return api.delete(`/team/${memberId}`, removeAckSchema);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  });
}
