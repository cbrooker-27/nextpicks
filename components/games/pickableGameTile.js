import cssStyles from "./pickableGameTile.module.css";
import TeamTile from "../teams/teamTile";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";

export default function PickableGameTile({ game }) {
  // const game = props.game;

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.gamemain}>
        <div className={cssStyles.gameteam}>
          <TeamTile team={game.home} home />
        </div>
        <div className={cssStyles.spread}>{game.spread}</div>
        <div className={cssStyles.gameteam}>
          <TeamTile className={cssStyles.gameteam} team={game.away} />
        </div>
      </div>
      <FormControl>
        <FormLabel id={`pickradiogroup-${game._id}-label`}>Pick</FormLabel>
        <RadioGroup
          aria-labelledby={`pickradiogroup-${game._id}-label`}
          name={`pickradiogroup-${game._id}`}
        >
          <FormControlLabel
            value="ff"
            control={<Radio />}
            label={`${game.home.name} will win by more than ${game.spread}`}
          />
          <FormControlLabel value="uf" control={<Radio />} label="uf" />
          <FormControlLabel value="uu" control={<Radio />} label="uu" />
        </RadioGroup>
      </FormControl>
      <div className={cssStyles.gamefooter}>
        {game.location} - <p className={cssStyles.gameid}>{game._id}</p>
      </div>
    </div>
  );
}
