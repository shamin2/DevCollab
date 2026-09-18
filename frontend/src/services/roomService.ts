import type {
  RoomMode,
  CreateRoomResponse,
  GetRoomResponse,
  CreateRoundResponse,
  JoinRoomResponse,
} from "../models/room";

import type {
  SubmitPokerVoteResponse,
  SubmitPokerVoteRequest,
  SubmitDecisionVoteRequest,
  SubmitDecisionVoteResponse,
  RevealRoundResponse,
  PokerResultsResponse,
  DecisionResultsResponse,
} from "../models/vote";

const API_URL = "http://localhost:5001/api";

export async function createRoom(
  mode: RoomMode,
  name: string
): Promise<CreateRoomResponse> {
  const response = await fetch(`${API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode,
      name: name.trim(),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || "Failed to create room"
    );
  }

  return response.json();
}

export async function joinRoom(
  code: string,
  name: string
): Promise<JoinRoomResponse> {
  const response = await fetch(
    `${API_URL}/rooms/${code.toUpperCase()}/members`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || "Failed to join room"
    );
  }

  return response.json();
}

export async function getRoom(
  code: string
): Promise<GetRoomResponse> {
  const response = await fetch(
    `${API_URL}/rooms/${code}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || "Failed to load room"
    );
  }

  return response.json();
}

export async function createRound(
  code: string,
  prompt: string,
  options?: string[]
): Promise<CreateRoundResponse> {
  const response = await fetch(
    `${API_URL}/rooms/${code}/rounds`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        options: options?.map((option) =>
          option.trim()
        ),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || "Failed to create round"
    );
  }

  return response.json();
}

export async function submitPokerVote(
  vote: SubmitPokerVoteRequest
): Promise<SubmitPokerVoteResponse> {
  const response = await fetch(
    `${API_URL}/rounds/${vote.roundId}/votes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: vote.memberId,
        pokerValue: vote.pokerValue,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || "Failed to submit vote"
    );
  }

  return response.json();
}

export async function submitDecisionVote(
  vote: SubmitDecisionVoteRequest
): Promise<SubmitDecisionVoteResponse> {
  const response = await fetch(
    `${API_URL}/rounds/${vote.roundId}/votes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: vote.memberId,
        optionId: vote.optionId,
        confidence: vote.confidence,
        reason: vote.reason?.trim() || null,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message ||
        "Failed to submit decision vote"
    );
  }

  return response.json();
}

export async function revealRound(
  roundId: number,
  memberId: number
): Promise<RevealRoundResponse> {
  const response = await fetch(
    `${API_URL}/rounds/${roundId}/reveal`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || "Failed to reveal votes"
    );
  }

  return response.json();
}

// Existing Planning Poker results function.
// We keep this name so Room.tsx continues working.
export async function getRoundResults(
  roundId: number
): Promise<PokerResultsResponse> {
  const response = await fetch(
    `${API_URL}/rounds/${roundId}/results`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message ||
        "Failed to load poker results"
    );
  }

  return response.json();
}

// Decision Room results function.
export async function getDecisionResults(
  roundId: number
): Promise<DecisionResultsResponse> {
  const response = await fetch(
    `${API_URL}/rounds/${roundId}/results`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message ||
        "Failed to load decision results"
    );
  }

  return response.json();
}