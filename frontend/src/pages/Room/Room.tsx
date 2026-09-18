import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Room.module.scss";

import {
  createRound,
  getRoom,
  submitPokerVote,
  submitDecisionVote,
  revealRound,
  getRoundResults,
  getDecisionResults,
} from "../../services/roomService";

import type {
  GetRoomResponse,
  Member,
} from "../../models/room";

import type {
  PokerResultsResponse,
  DecisionResultsResponse,
} from "../../models/vote";

import {
  POKER_VALUES,
  type PokerValue,
} from "../../constants/planningPoker";

import { socket } from "../../socket";

function Room() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();

  const [roomData, setRoomData] =
    useState<GetRoomResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [prompt, setPrompt] =
    useState("");

  const [decisionOptions, setDecisionOptions] =
    useState(["", ""]);

  const [isCreatingRound, setIsCreatingRound] =
    useState(false);

  const [selectedVote, setSelectedVote] =
    useState<PokerValue | null>(null);

  const [hasVoted, setHasVoted] =
    useState(false);

  const [isSubmittingVote, setIsSubmittingVote] =
    useState(false);

  const [pokerResults, setPokerResults] =
    useState<PokerResultsResponse | null>(null);

  const [decisionResults, setDecisionResults] =
    useState<DecisionResultsResponse | null>(null);

  const [isRevealing, setIsRevealing] =
    useState(false);

  const [votedCount, setVotedCount] =
    useState(0);

  const [selectedOptionId, setSelectedOptionId] =
    useState<number | null>(null);

  const [confidence, setConfidence] =
    useState<number | null>(null);

  const [reason, setReason] =
    useState("");

  const [codeCopied, setCodeCopied] =
    useState(false);

  const storedMember = sessionStorage.getItem(
    "devcollab-member"
  );

  const currentMember: Member | null =
    storedMember
      ? JSON.parse(storedMember)
      : null;

  // Load room data from backend.
  async function loadRoom() {
    if (!code) {
      setError("Room code is missing");
      setIsLoading(false);
      return;
    }

    try {
      setError("");

      const data = await getRoom(code);

      console.log(
        "Loaded room:",
        data
      );

      setRoomData(data);
      setVotedCount(data.votedCount);
    } catch (error) {
      console.error(
        "Failed to load room:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load room"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Load room when page opens.
  useEffect(() => {
    loadRoom();
  }, [code]);

  // Connect browser to Socket.IO room.
  useEffect(() => {
    if (!code) {
      return;
    }

    socket.connect();

    socket.emit(
      "join-room",
      code
    );

    console.log(
      `Joined socket room: ${code}`
    );

    return () => {
      socket.disconnect();
    };
  }, [code]);

  // Listen for new members joining the room.
  useEffect(() => {
    async function handleMemberJoined(data: {
      member: Member;
    }) {
      console.log(
        "Member joined:",
        data.member
      );

      await loadRoom();
    }

    socket.on(
      "member-joined",
      handleMemberJoined
    );

    return () => {
      socket.off(
        "member-joined",
        handleMemberJoined
      );
    };
  }, [code]);

  // Listen for the host starting an actual voting round.
  useEffect(() => {
    async function handleRoundCreated(data: {
      roundId: number;
    }) {
      console.log(
        "Round created:",
        data
      );

      setSelectedVote(null);
      setSelectedOptionId(null);
      setConfidence(null);
      setReason("");
      setHasVoted(false);
      setPokerResults(null);
      setDecisionResults(null);
      setVotedCount(0);

      await loadRoom();
    }

    socket.on(
      "round-created",
      handleRoundCreated
    );

    return () => {
      socket.off(
        "round-created",
        handleRoundCreated
      );
    };
  }, [code]);

  // Listen for the host moving everyone to a new round.
  useEffect(() => {
    function handleNewRoundStarted() {
      console.log(
        "New round started"
      );

      setPokerResults(null);
      setDecisionResults(null);
      setSelectedVote(null);
      setSelectedOptionId(null);
      setConfidence(null);
      setReason("");
      setHasVoted(false);
      setVotedCount(0);
      setPrompt("");
      setDecisionOptions(["", ""]);
      setError("");

      setRoomData((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          currentRound: null,
        };
      });
    }

    socket.on(
      "new-round-started",
      handleNewRoundStarted
    );

    return () => {
      socket.off(
        "new-round-started",
        handleNewRoundStarted
      );
    };
  }, [code]);

  // Listen for vote submissions from anyone in the room.
  useEffect(() => {
    function handleVoteSubmitted(data: {
      roundId: number;
      votedCount?: number;
    }) {
      if (
        roomData?.currentRound &&
        data.roundId ===
          roomData.currentRound.id
      ) {
        console.log(
          "Vote submitted event:",
          data
        );

        if (
          typeof data.votedCount ===
          "number"
        ) {
          setVotedCount(
            data.votedCount
          );
        }
      }
    }

    socket.on(
      "vote-submitted",
      handleVoteSubmitted
    );

    return () => {
      socket.off(
        "vote-submitted",
        handleVoteSubmitted
      );
    };
  }, [roomData?.currentRound?.id]);

  // Listen for the host revealing the round.
  useEffect(() => {
    async function handleRoundRevealed(data: {
      roundId: number;
    }) {
      if (
        !roomData?.currentRound ||
        data.roundId !==
          roomData.currentRound.id
      ) {
        return;
      }

      try {
        console.log(
          "Round revealed event:",
          data
        );

        if (roomData.room.mode === "planning_poker") {
          const resultData =
            await getRoundResults(
              data.roundId
            );

          setPokerResults(resultData);
          setDecisionResults(null);
        } else {
          const resultData =
            await getDecisionResults(
              data.roundId
            );

          setDecisionResults(resultData);
          setPokerResults(null);
        }

        await loadRoom();
      } catch (error) {
        console.error(
          "Failed to load revealed results:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load results"
        );
      }
    }

    socket.on(
      "round-revealed",
      handleRoundRevealed
    );

    return () => {
      socket.off(
        "round-revealed",
        handleRoundRevealed
      );
    };
  }, [roomData?.currentRound?.id]);

  // Host creates a new Planning Poker or Decision Room round.
  async function handleCreateRound() {
    if (
      !code ||
      !prompt.trim()
    ) {
      return;
    }

    const cleanedOptions =
      decisionOptions
        .map((option) => option.trim())
        .filter(Boolean);

    if (
      roomData?.room.mode === "decision" &&
      cleanedOptions.length < 2
    ) {
      setError(
        "Please enter at least 2 decision options"
      );
      return;
    }

    try {
      setIsCreatingRound(true);
      setError("");

      await createRound(
        code,
        prompt,
        roomData?.room.mode === "decision"
          ? cleanedOptions
          : undefined
      );

      setPrompt("");
      setDecisionOptions(["", ""]);
      setSelectedVote(null);
      setSelectedOptionId(null);
      setConfidence(null);
      setReason("");
      setHasVoted(false);
      setPokerResults(null);
      setDecisionResults(null);
      setVotedCount(0);

      await loadRoom();
    } catch (error) {
      console.error(
        "Failed to create round:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create round"
      );
    } finally {
      setIsCreatingRound(false);
    }
  }

  // Update one Decision Room option.
  function handleDecisionOptionChange(
    index: number,
    value: string
  ) {
    setDecisionOptions((previous) =>
      previous.map((option, optionIndex) =>
        optionIndex === index
          ? value
          : option
      )
    );
  }

  // Add another Decision Room option.
  function handleAddDecisionOption() {
    if (decisionOptions.length >= 6) {
      return;
    }

    setDecisionOptions((previous) => [
      ...previous,
      "",
    ]);
  }

  // Remove a Decision Room option.
  function handleRemoveDecisionOption(
    index: number
  ) {
    if (decisionOptions.length <= 2) {
      return;
    }

    setDecisionOptions((previous) =>
      previous.filter(
        (_, optionIndex) =>
          optionIndex !== index
      )
    );
  }

  // Submit Planning Poker vote.
  async function handlePokerVote(
    value: PokerValue
  ) {
    if (
      !currentMember ||
      !roomData?.currentRound
    ) {
      return;
    }

    try {
      setIsSubmittingVote(true);
      setError("");

      await submitPokerVote({
        roundId:
          roomData.currentRound.id,
        memberId:
          currentMember.id,
        pokerValue:
          value,
      });

      setSelectedVote(value);
      setHasVoted(true);

      console.log(
        `Vote submitted: ${value}`
      );
    } catch (error) {
      console.error(
        "Failed to submit vote:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit vote"
      );
    } finally {
      setIsSubmittingVote(false);
    }
  }

  // Submit Decision Room vote.
  async function handleDecisionVote() {
    if (
      !currentMember ||
      !roomData?.currentRound ||
      selectedOptionId === null ||
      confidence === null
    ) {
      return;
    }

    try {
      setIsSubmittingVote(true);
      setError("");

      await submitDecisionVote({
        roundId: roomData.currentRound.id,
        memberId: currentMember.id,
        optionId: selectedOptionId,
        confidence,
        reason,
      });

      setHasVoted(true);

      console.log(
        "Decision vote submitted"
      );
    } catch (error) {
      console.error(
        "Failed to submit decision vote:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit decision vote"
      );
    } finally {
      setIsSubmittingVote(false);
    }
  }

  // Host reveals votes.
  async function handleRevealVotes() {
    if (
      !currentMember ||
      !roomData?.currentRound
    ) {
      return;
    }

    try {
      setIsRevealing(true);
      setError("");

      const roundId =
        roomData.currentRound.id;

      await revealRound(
        roundId,
        currentMember.id
      );

      if (roomData.room.mode === "planning_poker") {
        const resultData =
          await getRoundResults(
            roundId
          );

        setPokerResults(resultData);
        setDecisionResults(null);
      } else {
        const resultData =
          await getDecisionResults(
            roundId
          );

        setDecisionResults(resultData);
        setPokerResults(null);
      }

      await loadRoom();
    } catch (error) {
      console.error(
        "Failed to reveal votes:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to reveal votes"
      );
    } finally {
      setIsRevealing(false);
    }
  }

  // Copy the room code to the clipboard.
  async function handleCopyRoomCode() {
    if (!roomData) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        roomData.room.code
      );

      setCodeCopied(true);

      setTimeout(() => {
        setCodeCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy room code:",
        error
      );
    }
  }

  // Host tells everyone to prepare for a new round.
  function handleNewRound() {
    if (!code) {
      return;
    }

    socket.emit(
      "new-round",
      code
    );
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>
          Loading room...
        </div>
      </main>
    );
  }

  if (error && !roomData) {
    return (
      <main className={styles.page}>
        <div className={styles.errorState}>
          <h1>Room not found</h1>

          <p>{error}</p>

          <button
            onClick={() =>
              navigate("/")
            }
          >
            Return Home
          </button>
        </div>
      </main>
    );
  }

  if (!roomData) {
    return null;
  }

  const {
    room,
    members,
    currentRound,
  } = roomData;

  const isHost =
    currentMember?.is_host === true;

  const votingPercentage =
    members.length > 0
      ? (votedCount /
          members.length) *
        100
      : 0;

  return (
    <main className={styles.page}>
      <div
        className={
          styles.glowLeft
        }
      />

      <div
        className={
          styles.glowRight
        }
      />

      {/* HEADER */}

      <header
        className={
          styles.header
        }
      >
        <button
          className={
            styles.brand
          }
          onClick={() =>
            navigate("/")
          }
        >
          <div
            className={
              styles.logo
            }
          >
            ◇
          </div>

          <span>
            DevCollab
          </span>
        </button>

        <div
          className={
            styles.roomInfo
          }
        >
          <div>
            <span>
              ROOM CODE
            </span>

            <strong>
              {room.code}
            </strong>
          </div>

          {isHost && (
            <div
              className={
                styles.hostBadge
              }
            >
              HOST
            </div>
          )}
        </div>
      </header>

      {/* DASHBOARD */}

      <div
        className={
          styles.dashboard
        }
      >
        {/* SIDEBAR */}

        <aside
          className={
            styles.sidebar
          }
        >
          <div
            className={
              styles.sidebarHeader
            }
          >
            <div>
              <span>
                TEAM
              </span>

              <h2>
                Members
              </h2>
            </div>

            <div
              className={
                styles.memberCount
              }
            >
              {members.length}
            </div>
          </div>

          <div
            className={
              styles.memberList
            }
          >
            {members.map(
              (member) => (
                <div
                  className={
                    styles.member
                  }
                  key={
                    member.id
                  }
                >
                  <div
                    className={
                      styles.avatar
                    }
                  >
                    {member.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div
                    className={
                      styles.memberDetails
                    }
                  >
                    <strong>
                      {
                        member.name
                      }
                    </strong>

                    <span>
                      {member.is_host
                        ? "Host"
                        : "Team member"}
                    </span>
                  </div>

                  <div
                    className={
                      styles.onlineDot
                    }
                  />
                </div>
              )
            )}
          </div>

          <div
            className={
              styles.inviteCard
            }
          >
            <span>
              INVITE YOUR TEAM
            </span>

            <strong>
              {room.code}
            </strong>

            <p>
              Share this room
              code with your
              teammates.
            </p>

            <button
              type="button"
              className={
                styles.copyCodeButton
              }
              onClick={
                handleCopyRoomCode
              }
            >
              {codeCopied
                ? "✓ Copied!"
                : "Copy Code"}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}

        <section
          className={
            styles.mainContent
          }
        >
          <div
            className={
              styles.roomHeading
            }
          >
            <div>
              <span
                className={
                  styles.modeLabel
                }
              >
                {room.mode === "planning_poker"
                  ? "⚡ PLANNING POKER"
                  : "◆ DECISION ROOM"}
              </span>

              <h1>
                {room.mode === "planning_poker"
                  ? pokerResults
                    ? "Votes revealed."
                    : currentRound
                      ? "Estimate together."
                      : "Start estimating."
                  : currentRound
                    ? "Decision in progress."
                    : "Make a decision."}
              </h1>

              <p>
                {room.mode === "planning_poker"
                  ? pokerResults
                    ? "See how the team estimated this story."
                    : currentRound
                      ? "Choose the estimate that best represents the effort required."
                      : "Add a story or task to start your first estimation round."
                  : currentRound
                    ? "Vote privately on the option you think is best."
                    : "Add a question and options to start your first team decision."}
              </p>
            </div>
          </div>

          {/* NO ROUND — HOST */}

          {!currentRound &&
            isHost &&
            room.mode ===
              "planning_poker" && (
              <div
                className={
                  styles.startRoundCard
                }
              >
                <div
                  className={
                    styles.cardLabel
                  }
                >
                  NEW ROUND
                </div>

                <h2>
                  What are we
                  estimating?
                </h2>

                <p>
                  Enter the story,
                  task, or feature
                  your team needs
                  to estimate.
                </p>

                <textarea
                  value={
                    prompt
                  }
                  onChange={(
                    event
                  ) =>
                    setPrompt(
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. Build user authentication flow"
                  maxLength={
                    300
                  }
                />

                <div
                  className={
                    styles.roundActions
                  }
                >
                  <span>
                    {
                      prompt.length
                    }
                    /300
                  </span>

                  <button
                    onClick={
                      handleCreateRound
                    }
                    disabled={
                      !prompt.trim() ||
                      isCreatingRound
                    }
                  >
                    {isCreatingRound
                      ? "Starting..."
                      : "Start Voting →"}
                  </button>
                </div>
              </div>
            )}

          {!currentRound &&
            isHost &&
            room.mode ===
              "decision" && (
              <div
                className={
                  styles.startRoundCard
                }
              >
                <div
                  className={
                    styles.cardLabel
                  }
                >
                  NEW DECISION
                </div>

                <h2>
                  What does your team
                  need to decide?
                </h2>

                <p>
                  Enter a question and
                  give your team between
                  2 and 6 options.
                </p>

                <textarea
                  value={prompt}
                  onChange={(event) =>
                    setPrompt(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Which database should we use?"
                  maxLength={300}
                />

                <div
                  className={
                    styles.roundActions
                  }
                >
                  <span>
                    {prompt.length}/300
                  </span>
                </div>

                <div className={styles.decisionBuilder}>
                  <div
                    className={
                      styles.cardLabel
                    }
                  >
                    OPTIONS
                  </div>

                  {decisionOptions.map(
                    (option, index) => (
                      <div
                        key={index}
                        className={styles.decisionOptionInputRow}
                      >
                        <input
                          value={option}
                          onChange={(event) =>
                            handleDecisionOptionChange(
                              index,
                              event.target.value
                            )
                          }
                          placeholder={`Option ${index + 1}`}
                          maxLength={100}
                          className={styles.decisionOptionInput}
                        />

                        {decisionOptions.length >
                          2 && (
                          <button
                            type="button"
                            className={styles.removeDecisionOption}
                            onClick={() =>
                              handleRemoveDecisionOption(
                                index
                              )
                            }
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )
                  )}

                  {decisionOptions.length <
                    6 && (
                    <button
                      type="button"
                      className={styles.addDecisionOption}
                      onClick={
                        handleAddDecisionOption
                      }
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                <div
                  className={`${styles.roundActions} ${styles.decisionRoundActions}`}
                >
                  <span>
                    {decisionOptions.length}
                    /6 options
                  </span>

                  <button
                    onClick={
                      handleCreateRound
                    }
                    disabled={
                      !prompt.trim() ||
                      decisionOptions.filter(
                        (option) =>
                          option.trim()
                      ).length < 2 ||
                      isCreatingRound
                    }
                  >
                    {isCreatingRound
                      ? "Starting..."
                      : "Start Voting →"}
                  </button>
                </div>
              </div>
            )}

          {/* NO ROUND — MEMBER */}

          {!currentRound &&
            !isHost && (
              <div
                className={
                  styles.waitingCard
                }
              >
                <div
                  className={
                    styles.waitingIcon
                  }
                >
                  ◇
                </div>

                <h2>
                  Waiting for the
                  host
                </h2>

                <p>
                  {room.mode ===
                  "planning_poker"
                    ? "The host will start the next estimation round shortly."
                    : "The host is preparing the next decision."}
                </p>
              </div>
            )}

          {/* ACTIVE ROUND */}

          {currentRound &&
            room.mode ===
              "planning_poker" &&
            !pokerResults && (
              <>
                <div
                  className={
                    styles.storyCard
                  }
                >
                  <span>
                    CURRENT STORY
                  </span>

                  <h2>
                    {
                      currentRound.prompt
                    }
                  </h2>

                  <div
                    className={
                      styles.votingStatus
                    }
                  >
                    <div
                      className={
                        styles.liveDot
                      }
                    />

                    Voting in
                    progress
                  </div>
                </div>

                {/* VOTING */}

                <div
                  className={
                    styles.voteSection
                  }
                >
                  <div
                    className={
                      styles.voteHeading
                    }
                  >
                    <div>
                      <span>
                        YOUR ESTIMATE
                      </span>

                      <h2>
                        Pick a card
                      </h2>
                    </div>

                    {selectedVote && (
                      <div
                        className={
                          styles.selectedText
                        }
                      >
                        Selected:{" "}
                        <strong>
                          {
                            selectedVote
                          }
                        </strong>
                      </div>
                    )}
                  </div>

                  <div
                    className={
                      styles.pokerCards
                    }
                  >
                    {POKER_VALUES.map(
                      (value) => (
                        <button
                          key={
                            value
                          }
                          className={
                            selectedVote ===
                            value
                              ? styles.selectedCard
                              : ""
                          }
                          onClick={() =>
                            handlePokerVote(
                              value
                            )
                          }
                          disabled={
                            isSubmittingVote
                          }
                        >
                          <span>
                            {
                              value
                            }
                          </span>
                        </button>
                      )
                    )}
                  </div>

                  <p
                    className={
                      styles.voteHint
                    }
                  >
                    {isSubmittingVote
                      ? "Submitting your vote..."
                      : hasVoted
                        ? `✓ Vote submitted — ${selectedVote} points`
                        : "Your estimate stays private until the host reveals the votes."}
                  </p>
                </div>

                {/* TEAM PROGRESS */}

                <div
                  className={
                    styles.progressCard
                  }
                >
                  <div>
                    <span>
                      TEAM PROGRESS
                    </span>

                    <strong>
                      {
                        votedCount
                      }{" "}
                      /{" "}
                      {
                        members.length
                      }{" "}
                      voted
                    </strong>
                  </div>

                  <div
                    className={
                      styles.progressBar
                    }
                  >
                    <div
                      className={styles.dynamicProgress}
                      style={
                        {
                          "--progress-width": `${votingPercentage}%`,
                        } as CSSProperties
                      }
                    />
                  </div>

                  {isHost && (
                    <button
                      onClick={
                        handleRevealVotes
                      }
                      disabled={
                        votedCount ===
                          0 ||
                        isRevealing
                      }
                    >
                      {isRevealing
                        ? "Revealing..."
                        : "Reveal Votes"}
                    </button>
                  )}
                </div>
              </>
            )}

          {/* ACTIVE DECISION ROOM */}

          {currentRound &&
            room.mode === "decision" &&
            currentRound.status === "voting" && (
              <>
                <div
                  className={
                    styles.storyCard
                  }
                >
                  <span>
                    CURRENT DECISION
                  </span>

                  <h2>
                    {currentRound.prompt}
                  </h2>

                  <div
                    className={
                      styles.votingStatus
                    }
                  >
                    <div
                      className={
                        styles.liveDot
                      }
                    />
                    Voting in progress
                  </div>
                </div>

                <div
                  className={
                    styles.voteSection
                  }
                >
                  <div
                    className={
                      styles.voteHeading
                    }
                  >
                    <div>
                      <span>
                        YOUR CHOICE
                      </span>
                      <h2>
                        Choose an option
                      </h2>
                    </div>
                  </div>

                  <div className={styles.decisionOptions}>
                    {roomData.options.map(
                      (option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setSelectedOptionId(
                              option.id
                            )
                          }
                          disabled={
                            isSubmittingVote
                          }
                          className={`${styles.decisionOption} ${
                            selectedOptionId === option.id
                              ? styles.selectedDecisionOption
                              : ""
                          }`}
                        >
                          {selectedOptionId === option.id
                            ? "● "
                            : "○ "}
                          {option.label}
                        </button>
                      )
                    )}
                  </div>

                  <div className={styles.confidenceSection}>
                    <span>
                      YOUR CONFIDENCE
                    </span>
                    <h2>
                      How confident are you?
                    </h2>

                    <div className={styles.confidenceButtons}>
                      {Array.from(
                        { length: 10 },
                        (_, index) => index + 1
                      ).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setConfidence(value)
                          }
                          disabled={
                            isSubmittingVote
                          }
                          className={`${styles.confidenceButton} ${
                            confidence === value
                              ? styles.selectedConfidence
                              : ""
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.reasonSection}>
                    <span>
                      REASON (OPTIONAL)
                    </span>
                    <textarea
                      value={reason}
                      onChange={(event) =>
                        setReason(event.target.value)
                      }
                      placeholder="Explain why you chose this option..."
                      maxLength={500}
                      disabled={
                        isSubmittingVote
                      }
                      className={styles.reasonTextarea}
                    />
                    <div className={styles.reasonCount}>
                      {reason.length}/500
                    </div>
                  </div>

                  <div
                    className={`${styles.roundActions} ${styles.decisionRoundActions}`}
                  >
                    <span>
                      {hasVoted
                        ? "✓ Vote submitted"
                        : "Your vote stays private until reveal."}
                    </span>
                    <button
                      type="button"
                      onClick={
                        handleDecisionVote
                      }
                      disabled={
                        selectedOptionId === null ||
                        confidence === null ||
                        isSubmittingVote
                      }
                    >
                      {isSubmittingVote
                        ? "Submitting..."
                        : hasVoted
                          ? "Update Vote"
                          : "Submit Vote"}
                    </button>
                  </div>
                </div>

                <div
                  className={
                    styles.progressCard
                  }
                >
                  <div>
                    <span>
                      TEAM PROGRESS
                    </span>
                    <strong>
                      {votedCount} / {members.length} voted
                    </strong>
                  </div>

                  <div
                    className={
                      styles.progressBar
                    }
                  >
                    <div
                      className={styles.dynamicProgress}
                      style={
                        {
                          "--progress-width": `${votingPercentage}%`,
                        } as CSSProperties
                      }
                    />
                  </div>

                  {isHost && (
                    <button
                      onClick={
                        handleRevealVotes
                      }
                      disabled={
                        votedCount === 0 ||
                        isRevealing
                      }
                    >
                      {isRevealing
                        ? "Revealing..."
                        : "Reveal Decision"}
                    </button>
                  )}
                </div>
              </>
            )}

          {/* RESULTS */}

          {currentRound &&
            room.mode ===
              "planning_poker" &&
            pokerResults && (
              <>
                <div
                  className={
                    styles.storyCard
                  }
                >
                  <span>
                    ESTIMATED STORY
                  </span>

                  <h2>
                    {
                      currentRound.prompt
                    }
                  </h2>

                  <div
                    className={
                      styles.votingStatus
                    }
                  >
                    Votes revealed
                  </div>
                </div>

                <div
                  className={
                    styles.resultsSection
                  }
                >
                  <div
                    className={
                      styles.resultsHeader
                    }
                  >
                    <div>
                      <span>
                        ROUND RESULTS
                      </span>

                      <h2>
                        Team estimates
                      </h2>

                      <p>
                        All submitted
                        estimates are
                        now visible.
                      </p>
                    </div>

                    <div
                      className={
                        styles.averageCard
                      }
                    >
                      <span>
                        AVERAGE
                      </span>

                      <strong>
                        {pokerResults.average !==
                        null
                          ? Number(
                              pokerResults.average.toFixed(
                                1
                              )
                            )
                          : "—"}
                      </strong>

                      <small>
                        points
                      </small>
                    </div>
                  </div>

                  <div
                    className={
                      styles.resultVotes
                    }
                  >
                    {pokerResults.votes.map(
                      (vote) => (
                        <div
                          className={
                            styles.resultVote
                          }
                          key={
                            vote.member_id
                          }
                        >
                          <div
                            className={
                              styles.resultMember
                            }
                          >
                            <div
                              className={
                                styles.avatar
                              }
                            >
                              {vote.name
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {
                                  vote.name
                                }
                              </strong>

                              <span>
                                Team member
                              </span>
                            </div>
                          </div>

                          <div
                            className={
                              styles.resultValue
                            }
                          >
                            {
                              vote.poker_value
                            }
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div
                    className={
                      styles.resultSummary
                    }
                  >
                    <span>
                      {
                        pokerResults.votes
                          .length
                      }{" "}
                      {pokerResults.votes
                        .length ===
                      1
                        ? "vote"
                        : "votes"}{" "}
                      revealed
                    </span>

                    {isHost && (
                      <button
                        onClick={
                          handleNewRound
                        }
                      >
                        New Round →
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

          {/* DECISION ROOM RESULTS */}

          {currentRound &&
            room.mode === "decision" &&
            decisionResults && (
              <>
                <div className={styles.storyCard}>
                  <span>DECISION</span>
                  <h2>{currentRound.prompt}</h2>
                  <div className={styles.votingStatus}>
                    Decision revealed
                  </div>
                </div>

                <div className={styles.resultsSection}>
                  <div className={styles.resultsHeader}>
                    <div>
                      <span>DECISION RESULTS</span>
                      <h2>Team decision</h2>
                      <p>
                        All submitted choices, confidence levels, and reasons are now visible.
                      </p>
                    </div>
                  </div>

                  <div className={styles.decisionResults}>
                    {decisionResults.results.map((option) => (
                      <div
                        key={option.id}
                        className={styles.decisionResultOption}
                      >
                        <div className={styles.decisionResultHeader}>
                          <strong>{option.label}</strong>
                          <span>
                            {option.percentage}% • {option.vote_count}{" "}
                            {option.vote_count === 1 ? "vote" : "votes"}
                          </span>
                        </div>

                        <div className={`${styles.progressBar} ${styles.decisionResultBar}`}>
                          <div
                            className={`${styles.dynamicProgress} ${styles.decisionResultFill}`}
                            style={
                              {
                                "--progress-width": `${option.percentage}%`,
                              } as CSSProperties
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.teamResponses}>
                    <div className={styles.cardLabel}>
                      TEAM RESPONSES
                    </div>

                    <div className={styles.teamResponseList}>
                      {decisionResults.votes.map((vote) => (
                        <div
                          key={vote.member_id}
                          className={`${styles.resultVote} ${styles.teamResponse}`}
                        >
                          <div className={styles.resultMember}>
                            <div className={styles.avatar}>
                              {vote.name.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <strong>{vote.name}</strong>
                              <span className={styles.responseChoice}>
                                {vote.option}
                              </span>
                              <span className={styles.responseConfidence}>
                                Confidence {vote.confidence}/10
                              </span>
                              {vote.reason && (
                                <p className={styles.responseReason}>
                                  “{vote.reason}”
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.resultSummary}>
                    <span>
                      {decisionResults.totalVotes}{" "}
                      {decisionResults.totalVotes === 1 ? "vote" : "votes"} revealed
                    </span>

                    {isHost && (
                      <button onClick={handleNewRound}>
                        New Decision →
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

          {/* ERROR */}

          {error && (
            <p
              className={
                styles.errorMessage
              }
            >
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default Room;