import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";

interface StyledSwitchProps {
  game: any;
  theme?: any;
};

const StyledSwitch = styled(Switch)<StyledSwitchProps>(({game, theme}) => ({
  width: 62,
  height: 34,
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(6px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url(${game.away.officialLogoImageSrc})`,
        backgroundSize: "cover",
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: game.away.teamColoursHex[0],
        ...theme.applyStyles("dark", {
          backgroundColor: "#8796A5",
        }),
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: "#001e3c",
    width: 32,
    height: 32,
    "&::before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundImage: `url(${game.home.officialLogoImageSrc})`,
      backgroundSize: "cover",
    },
    ...theme.applyStyles("dark", {
      backgroundColor: "#003892",
    }),
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: game.home.teamColoursHex[0],
    borderRadius: 20 / 2,
    ...theme.applyStyles("dark", {
      backgroundColor: "#8796A5",
    }),
  },
}));

export default function FavoriteSwitch({ game, gameIndex, favoriteUpdated }) {
  return (
    <StyledSwitch
      game={game}
      checked={game.awayFavorite||false}
      onChange={(event) => favoriteUpdated(gameIndex, event.target.checked)}
    />
  );
}
