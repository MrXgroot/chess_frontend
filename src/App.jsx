import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import io from "socket.io-client";
import "./App.css";
import { Chess } from "chess.js";
import logo from "./assets/logo.svg";
const socket = io("https://chess-backend-1-728q.onrender.com");
function App() {
  const [gameId, setGameId] = useState(null);
  const [loadGame, setLoadGame] = useState(false);
  const [boardWidth, setBoardWidth] = useState(
    Math.min(window.innerWidth, 500)
  );
  const [fen, setFen] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  const [role, setRole] = useState(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const copyToClipboard = () => {
    if (gameId) {
      navigator.clipboard
        .writeText(gameId)
        .then(() => {
          alert("Game ID copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
  };
  useEffect(() => {
    socket.on("error", (e) => {
      console.error(e);
    });

    const handleResize = () => {
      setBoardWidth(Math.min(window.innerWidth, 500));

      console.log(boardWidth);
    };

    window.addEventListener("resize", handleResize);
    socket.on("loadBoard", () => {
      setLoadGame(true);
    });
    socket.on("gameCreated", ({ gameId, role }) => {
      // console.log(gameId);
      setGameId(gameId);
      setRole(role);
      setIsPlayerTurn(role == "white");
    });

    socket.on("roleAssigned", ({ role }) => {
      setRole(role);
      setIsPlayerTurn(role === "white");
      // console.log("role is ", role, "    isPlayerTurn", isPlayerTurn);
    });
    socket.on("playerJoined", ({ players, gameId }) => {
      setGameId(gameId);
      // console.log("player joined", players, gameId);
    });

    socket.on("moveMade", ({ fen }) => {
      // console.log("move made", isPlayerTurn);
      setFen(fen);
      setIsPlayerTurn((p) => !p);
    });

    socket.on("matchClosed", (message) => {
      setGameId(null);
      setFen("start");
      setRole(null);
      setIsPlayerTurn(true);
      setLoadGame(false);
      alert(message);
    });
    return () => {
      socket.off();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const createGame = () => {
    socket.emit("createGame");
  };
  const joinGame = (id) => {
    socket.emit("joinGame", id);
  };
  const quitGame = () => {
    if (!loadGame) return;
    window.location.reload();
  };

  const onPieceDrop = (sourceSquare, targetSquare) => {
    if (!isPlayerTurn) {
      // console.log("not your turn");
      return false;
    }
    const move = { from: sourceSquare, to: targetSquare };
    let result = null;
    const chess = new Chess(fen);
    try {
      result = chess.move(move);
    } catch (e) {}

    if (result) {
      setFen(chess.fen());
      // console.log(isPlayerTurn);
      socket.emit("makeMove", { gameId, move });
    } else {
      return false;
    }
    return true;
  };
  const joinRandom = () => {
    socket.emit("joinRandom");
    alert("wait until some one joins the game");
  };

  return (
    <div className="game-container">
      <div className="header">
        <div className="logo-container">
          <img src={logo} alt="" className="game-logo" onClick={quitGame} />
        </div>

        <h1>CHESS MANIA</h1>
      </div>

      {!loadGame && (
        <div className="game-buttons">
          <button onClick={createGame}>Create Game</button>

          <button onClick={() => joinGame(prompt("Enter Game ID"))}>
            Join Game
          </button>

          <button onClick={joinRandom}>join Random</button>
          {gameId && (
            <label onClick={copyToClipboard}>
              <span>{`click to copy ID`}</span>
            </label>
          )}
        </div>
      )}

      {loadGame && (
        <div className="chessboard-container">
          <Chessboard
            className="chess-board"
            position={fen}
            onPieceDrop={onPieceDrop}
            boardWidth={boardWidth - 19}
            boardOrientation={role}
          />
        </div>
      )}
    </div>
  );
}

export default App;
