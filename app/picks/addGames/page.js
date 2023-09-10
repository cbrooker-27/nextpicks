'use client'
import GameTile from "./gameTile";
import { createContext, useContext, useState, useEffect } from "react";

export default function AddGames() {
//  const [gamesForm, updateGamesForm] = createContext(null);

  //const [spreadsEntered, setSpreadsEntered] = useState(null);

  const [games,setGames] = useState(null);
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/picks/games')
      .then((res) => res.json())
      .then((data) => {
        setGames(data)
        setLoading(false)
      })
  }, [])

  
  function gameSpreadUpdated(index, spread) {
    console.log("index:" + index);
    console.log("spread:" + spread);
  }

 
  if (isLoading) return <p>Loading...</p>
  if (!games) return <p>No game data</p>
 
  return (
    <div>
      <div>
        <h1>Add Games</h1>
        <button>Submit</button>
      </div>
      {games.map((game, index) => (
        <GameTile game={game} key={index} spreadUpdated={gameSpreadUpdated} />
      ))}
    </div>
  );
}

export async function getServerSideProps(){

}
