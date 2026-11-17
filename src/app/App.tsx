import { useEffect, useState, type FormEvent } from "react";
import { createGame, type Game } from "../domain/game";
import { listGames, saveGame } from "../infrastructure/game-repository";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameName, setGameName] = useState("");
  const [playerNames, setPlayerNames] = useState(["", "", "", "", ""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    listGames()
      .then((savedGames) => {
        if (active) setGames(savedGames);
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleCreateGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const game = createGame({
        id: crypto.randomUUID(),
        name: gameName,
        players: playerNames
          .filter((playerName) => playerName.trim())
          .map((playerName) => ({ id: crypto.randomUUID(), name: playerName })),
        createdAt: new Date().toISOString(),
      });

      setSaving(true);
      await saveGame(game);
      setGames((currentGames) => [game, ...currentGames]);
      setSelectedGame(game);
      setGameName("");
      setPlayerNames(["", "", "", "", ""]);
      setNotice("Partida salva neste dispositivo.");
    } catch (saveError: unknown) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  function updatePlayerName(index: number, name: string) {
    setPlayerNames((currentNames) =>
      currentNames.map((currentName, currentIndex) =>
        currentIndex === index ? name : currentName,
      ),
    );
  }

  function addPlayerField() {
    setPlayerNames((currentNames) => [...currentNames, ""]);
  }

  function removePlayerField(index: number) {
    setPlayerNames((currentNames) =>
      currentNames.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Werewolf God, início">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span className="brand-copy">
            <strong>WEREWOLF GOD</strong>
            <span>ASSISTENTE DO MESTRE</span>
          </span>
        </a>
        <span className="status-pill"><span /> PRÉ-VERSÃO</span>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">A NOITE COMEÇA COM UMA BOA PREPARAÇÃO</p>
          <h1 id="page-title">Sua mesa,<br /><em>sob seu comando.</em></h1>
          <p className="intro-copy">
            Organize os participantes e prepare a partida. As regras ficam nas
            mãos do mestre — nada será automatizado sem estar definido.
          </p>
        </section>

        <div className="workspace">
          <section className="panel create-panel" aria-labelledby="create-title">
            <div className="panel-heading">
              <span className="step-number">01</span>
              <div>
                <p className="eyebrow">PREPARAÇÃO</p>
                <h2 id="create-title">Nova partida</h2>
              </div>
            </div>

            <form onSubmit={handleCreateGame}>
              <label className="field-label" htmlFor="game-name">Nome da partida</label>
              <input
                autoComplete="off"
                id="game-name"
                maxLength={60}
                onChange={(event) => setGameName(event.target.value)}
                placeholder="Ex.: Noite na Vila"
                required
                value={gameName}
              />

              <div className="players-heading">
                <span className="field-label">Participantes</span>
                <span className="field-hint">Adicione os nomes da mesa</span>
              </div>

              <div className="player-fields">
                {playerNames.map((playerName, index) => (
                  <div className="player-field" key={index}>
                    <span className="player-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <input
                      aria-label={`Nome do participante ${index + 1}`}
                      autoComplete="off"
                      maxLength={40}
                      onChange={(event) => updatePlayerName(index, event.target.value)}
                      placeholder={`Participante ${index + 1}`}
                      value={playerName}
                    />
                    {playerNames.length > 1 && (
                      <button
                        aria-label={`Remover participante ${index + 1}`}
                        className="remove-player"
                        onClick={() => removePlayerField(index)}
                        type="button"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button className="add-player" onClick={addPlayerField} type="button">
                <span aria-hidden="true">+</span> Adicionar participante
              </button>

              {error && <p className="message error-message" role="alert">{error}</p>}
              {notice && <p className="message success-message" role="status">{notice}</p>}

              <button className="primary-button" disabled={saving || loading} type="submit">
                {saving ? "Salvando..." : "Criar partida"}
                <span aria-hidden="true">↗</span>
              </button>
              <p className="local-note">
                <span aria-hidden="true">◈</span> Salva apenas neste dispositivo
              </p>
            </form>
          </section>

          <section className="panel games-panel" aria-labelledby="games-title">
            <div className="panel-heading">
              <span className="step-number">02</span>
              <div>
                <p className="eyebrow">CONTINUE DE ONDE PAROU</p>
                <h2 id="games-title">Suas partidas</h2>
              </div>
            </div>

            {loading ? (
              <p className="empty-state">Carregando partidas salvas...</p>
            ) : games.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">☾</span>
                <p>Nenhuma partida por aqui.</p>
                <span>Crie uma nova para começar a preparar sua mesa.</span>
              </div>
            ) : (
              <ul className="game-list">
                {games.map((game) => (
                  <li key={game.id}>
                    <button
                      aria-pressed={selectedGame?.id === game.id}
                      className={`game-card${selectedGame?.id === game.id ? " selected" : ""}`}
                      onClick={() => setSelectedGame(game)}
                      type="button"
                    >
                      <span className="game-card-icon" aria-hidden="true">☾</span>
                      <span className="game-card-copy">
                        <strong>{game.name}</strong>
                        <span>{game.players.length} participantes</span>
                      </span>
                      <span className="game-card-arrow" aria-hidden="true">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selectedGame && (
              <div className="game-detail">
                <p className="detail-label">PARTICIPANTES</p>
                <ul>
                  {selectedGame.players.map((player) => (
                    <li key={player.id}>{player.name}</li>
                  ))}
                </ul>
                <p className="detail-note">
                  A atribuição de personagens e a condução da partida serão
                  adicionadas após a definição das regras.
                </p>
              </div>
            )}
          </section>
        </div>

        <footer className="page-footer">
          <span>FEITO PARA QUEM CONDUZ A HISTÓRIA</span>
          <span>AS REGRAS SÃO SUAS</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
