import GameTile from "./gameTile";

export default async function AddGames(){

    function findTeam(team){
        return team.abbreviation === this
    }

    //const msfUrl = "https://api.mysportsfeeds.com/v2.1/pull/nfl/"+getSeason()+"-regular/week/" + getWeek() + "/games.json"
    const msfUrl = "https://api.mysportsfeeds.com/v2.1/pull/nfl/2023-2024-regular/week/1/games.json"
    const headers = new Headers();
    console.log(process.env.MYSPORTSFEEDS_CREDS);
    headers.append("Authorization",'Basic '+ Buffer.from(""+process.env.MYSPORTSFEEDS_CREDS).toString('base64'));
    console.log(headers)
    const response = await fetch(msfUrl,{method:'GET', headers:headers})
    console.log(response)
    const resJson = await response.json()
    const games = resJson.games;
    const teams = resJson.references.teamReferences;
    const simpleGames = games.map(game=>
        {
            return {
                "id": game.schedule.id,
                "week" : game.schedule.week,
                "away" : teams.find(findTeam,game.schedule.awayTeam.abbreviation),
                "home" : teams.find(findTeam,game.schedule.homeTeam.abbreviation),
                "location" : game.schedule.venue.name
            }
        })
    
    return (<div style={{align: "center"}}>Adding Games
        {simpleGames.map(game=><GameTile game={game}/>)}
    </div>)
    
}