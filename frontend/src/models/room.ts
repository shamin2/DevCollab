export type RoomMode = "planning_poker" | "decision";

export interface Room {
  id: number;
  code: string;
  mode: RoomMode;
  created_at: string;
}

export interface Member {
  id: number;
  room_id: number;
  name: string;
  is_host: boolean;
  joined_at: string;
}

export interface CreateRoomResponse {
  room: Room;
  member: Member;
}

export interface Round {
  id: number;
  room_id: number;
  prompt: string;
  status: "voting" | "revealed";
  created_at: string;
}

export interface Option {
  id: number;
  round_id: number;
  label: string;
}

export interface GetRoomResponse {
  room: Room;
  members: Member[];
  currentRound: Round | null;
  options: Option[];
  votedCount: number;
}

export interface CreateRoundResponse{
    room: Room;
    round: Round;
    options:Option[];
}

export interface JoinRoomResponse {
  room: Room;
  member: Member;
}