export interface PokerVote {
  id: number;
  round_id: number;
  member_id: number;
  poker_value: string;
}

export interface SubmitPokerVoteResponse {
  message: string;
  vote: PokerVote;
}

export interface SubmitPokerVoteRequest {
  roundId: number;
  memberId: number;
  pokerValue: string;
}

export interface PokerResultVote {
  member_id: number;
  name: string;
  poker_value: string;
}

export interface PokerResultsResponse {
  round: {
    id: number;
    room_id: number;
    prompt: string;
    status: "revealed";
    mode: "planning_poker";
  };
  votes: PokerResultVote[];
  average: number | null;
}

export interface RevealRoundResponse {
  message: string;
  round: {
    id: number;
    room_id: number;
    prompt: string;
    status: "revealed";
    created_at: string;
  };
}

// -------------------------
// DECISION ROOM
// -------------------------

export interface SubmitDecisionVoteRequest {
  roundId: number;
  memberId: number;
  optionId: number;
  confidence: number;
  reason?: string;
}

export interface DecisionVote {
  id: number;
  round_id: number;
  member_id: number;
  option_id: number;
  confidence: number;
  reason: string | null;
}

export interface SubmitDecisionVoteResponse {
  message: string;
  vote: DecisionVote;
}

export interface DecisionResultOption {
  id: number;
  label: string;
  vote_count: number;
  percentage: number;
}

export interface DecisionResultVote {
  member_id: number;
  name: string;
  option_id: number;
  option: string;
  confidence: number;
  reason: string | null;
}

export interface DecisionResultsResponse {
  round: {
    id: number;
    room_id: number;
    prompt: string;
    status: "revealed";
    mode: "decision";
  };
  totalVotes: number;
  results: DecisionResultOption[];
  votes: DecisionResultVote[];
}