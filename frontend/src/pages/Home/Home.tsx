import { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./Home.module.scss";
import {
  createRoom,
  joinRoom,
} from "../../services/roomService";
import type {
  RoomMode,
} from "../../models/room";

function Home() {
  const navigate = useNavigate();

  const [selectedMode, setSelectedMode] =
    useState<RoomMode | null>(null);

  const [name, setName] =
    useState("");

  const [roomCode, setRoomCode] =
    useState("");

  const [joinModalOpen, setJoinModalOpen] =
    useState(false);

  const [isCreating, setIsCreating] =
    useState(false);

  const [isJoining, setIsJoining] =
    useState(false);

  const [error, setError] =
    useState("");

  function openCreateRoom(
    mode: RoomMode
  ) {
    setSelectedMode(mode);
    setName("");
    setError("");
  }

  function closeCreateModal() {
    setSelectedMode(null);
    setName("");
    setError("");
  }

  function openJoinModal() {
    const normalizedCode =
      roomCode.trim().toUpperCase();

    if (!normalizedCode) {
      return;
    }

    setRoomCode(normalizedCode);
    setName("");
    setError("");
    setJoinModalOpen(true);
  }

  function closeJoinModal() {
    setJoinModalOpen(false);
    setName("");
    setError("");
  }

  async function handleCreateRoom() {
    if (
      !selectedMode ||
      !name.trim()
    ) {
      return;
    }

    try {
      setIsCreating(true);
      setError("");

      const data = await createRoom(
        selectedMode,
        name
      );

      console.log(
        "Room created:",
        data
      );

      sessionStorage.setItem(
        "devcollab-member",
        JSON.stringify(
          data.member
        )
      );

      navigate(
        `/room/${data.room.code}`
      );
    } catch (error) {
      console.error(
        "Failed to create room:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create room"
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoinRoom() {
    if (
      !roomCode.trim() ||
      !name.trim()
    ) {
      return;
    }

    try {
      setIsJoining(true);
      setError("");

      const data = await joinRoom(
        roomCode,
        name
      );

      console.log(
        "Joined room:",
        data
      );

      sessionStorage.setItem(
        "devcollab-member",
        JSON.stringify(
          data.member
        )
      );

      navigate(
        `/room/${data.room.code}`
      );
    } catch (error) {
      console.error(
        "Failed to join room:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to join room"
      );
    } finally {
      setIsJoining(false);
    }
  }

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

      {/* Navbar */}

      <nav
        className={
          styles.navbar
        }
      >
        <div
          className={
            styles.brand
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
        </div>

        <div
          className={
            styles.navLinks
          }
        >
          <a
            className={
              styles.active
            }
            href="#"
          >
            Home
          </a>

          <a href="#tools">
            How it works
          </a>
        </div>

        <button
          className={
            styles.getStarted
          }
        >
          Get Started
        </button>
      </nav>

      {/* Hero */}

      <section
        className={
          styles.hero
        }
      >
        <div
          className={
            styles.badge
          }
        >
          <span>⚡</span>
          Real-time collaboration
        </div>

        <h1>
          Collaborate.
          <br />
          Estimate.{" "}
          <span>
            Decide.
          </span>
        </h1>

        <p>
          Real-time collaboration tools built for
          <br />
          development teams.
        </p>
      </section>

      {/* Tools */}

      <section
        className={
          styles.tools
        }
        id="tools"
      >
        <article
          className={
            styles.toolCard
          }
        >
          <div
            className={
              styles.cardIcon
            }
          >
            ♢
          </div>

          <div
            className={
              styles.cardContent
            }
          >
            <h2>
              Planning Poker
            </h2>

            <p>
              Estimate work together
              <br />
              with your team.
            </p>

            <button
              onClick={() =>
                openCreateRoom(
                  "planning_poker"
                )
              }
            >
              Create Room
              <span>→</span>
            </button>
          </div>
        </article>

        <article
          className={
            styles.toolCard
          }
        >
          <div
            className={
              styles.cardIcon
            }
          >
            ▥
          </div>

          <div
            className={
              styles.cardContent
            }
          >
            <h2>
              Decision Room
            </h2>

            <p>
              Vote on technical ideas
              <br />
              and move forward.
            </p>

            <button
              onClick={() =>
                openCreateRoom(
                  "decision"
                )
              }
            >
              Create Room
              <span>→</span>
            </button>
          </div>
        </article>
      </section>

      {/* Join existing room */}

      <section
        className={
          styles.join
        }
      >
        <div
          className={
            styles.divider
          }
        >
          <span />
          <p>or</p>
          <span />
        </div>

        <p
          className={
            styles.joinTitle
          }
        >
          Already have a room?
        </p>

        <div
          className={
            styles.joinForm
          }
        >
          <input
            type="text"
            placeholder="Enter room code (e.g. X66PCU)"
            value={roomCode}
            onChange={(event) =>
              setRoomCode(
                event.target.value
                  .toUpperCase()
              )
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                  "Enter" &&
                roomCode.trim()
              ) {
                openJoinModal();
              }
            }}
            maxLength={6}
          />

          <button
            onClick={
              openJoinModal
            }
            disabled={
              !roomCode.trim()
            }
          >
            Join Room
            <span>→</span>
          </button>
        </div>
      </section>

      {/* Footer */}

      <footer
        className={
          styles.footer
        }
      >
        <p>
          Built for developers,
          <br />
          by Shamin Yasar.
        </p>

        <p>
          Better discussions.
          <br />
          Faster decisions.
        </p>
      </footer>

      {/* Create Room Modal */}

      {selectedMode && (
        <div
          className={
            styles.modalOverlay
          }
          onMouseDown={
            closeCreateModal
          }
        >
          <div
            className={
              styles.modal
            }
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <button
              className={
                styles.closeButton
              }
              onClick={
                closeCreateModal
              }
              aria-label="Close modal"
            >
              ×
            </button>

            <div
              className={
                styles.modalGlow
              }
            />

            <div
              className={
                styles.modalIcon
              }
            >
              {selectedMode ===
              "planning_poker"
                ? "♢"
                : "▥"}
            </div>

            <span
              className={
                styles.modalLabel
              }
            >
              {selectedMode ===
              "planning_poker"
                ? "Planning Poker"
                : "Decision Room"}
            </span>

            <h2>
              Create your room
            </h2>

            <p
              className={
                styles.modalDescription
              }
            >
              {selectedMode ===
              "planning_poker"
                ? "Start an estimation session and invite your team to vote."
                : "Create a decision room and let your team vote on technical ideas."}
            </p>

            <div
              className={
                styles.nameField
              }
            >
              <label
                htmlFor="displayName"
              >
                Your display name
              </label>

              <input
                id="displayName"
                type="text"
                placeholder="e.g. Shamin"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      "Enter" &&
                    name.trim() &&
                    !isCreating
                  ) {
                    handleCreateRoom();
                  }
                }}
                maxLength={50}
                autoFocus
              />
            </div>

            <button
              className={
                styles.createRoomButton
              }
              onClick={
                handleCreateRoom
              }
              disabled={
                !name.trim() ||
                isCreating
              }
            >
              {isCreating ? (
                "Creating..."
              ) : (
                <>
                  Create Room
                  <span>→</span>
                </>
              )}
            </button>

            {error && (
              <p
                className={
                  styles.errorMessage
                }
              >
                {error}
              </p>
            )}

            <p
              className={
                styles.modalHint
              }
            >
              No account required
              <span>•</span>
              Share the room code with your team
            </p>
          </div>
        </div>
      )}

      {/* Join Room Modal */}

      {joinModalOpen && (
        <div
          className={
            styles.modalOverlay
          }
          onMouseDown={
            closeJoinModal
          }
        >
          <div
            className={
              styles.modal
            }
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <button
              className={
                styles.closeButton
              }
              onClick={
                closeJoinModal
              }
              aria-label="Close modal"
            >
              ×
            </button>

            <div
              className={
                styles.modalGlow
              }
            />

            <div
              className={
                styles.modalIcon
              }
            >
              ◇
            </div>

            <span
              className={
                styles.modalLabel
              }
            >
              ROOM {roomCode}
            </span>

            <h2>
              Join the room
            </h2>

            <p
              className={
                styles.modalDescription
              }
            >
              Enter your display name
              to join your team.
            </p>

            <div
              className={
                styles.nameField
              }
            >
              <label
                htmlFor="joinDisplayName"
              >
                Your display name
              </label>

              <input
                id="joinDisplayName"
                type="text"
                placeholder="e.g. Alex"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      "Enter" &&
                    name.trim() &&
                    !isJoining
                  ) {
                    handleJoinRoom();
                  }
                }}
                maxLength={50}
                autoFocus
              />
            </div>

            <button
              className={
                styles.createRoomButton
              }
              onClick={
                handleJoinRoom
              }
              disabled={
                !name.trim() ||
                isJoining
              }
            >
              {isJoining ? (
                "Joining..."
              ) : (
                <>
                  Join Room
                  <span>→</span>
                </>
              )}
            </button>

            {error && (
              <p
                className={
                  styles.errorMessage
                }
              >
                {error}
              </p>
            )}

            <p
              className={
                styles.modalHint
              }
            >
              No account required
              <span>•</span>
              Your vote stays private until reveal
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default Home;