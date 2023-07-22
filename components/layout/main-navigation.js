import Link from "next/link";
import Image from "next/image";

import Logo from "./logo";
import classes from "./main-navigation.module.css";

function MainNavigation() {
  return (
    <header className={classes.header}>
      <Link href="/">
        <Image src="/next.svg" width={50} height={50} alt="logo" />
        <Logo />
      </Link>
      <nav>
        <ul>
          <li>
            <Link href="/picks">Picks</Link>
          </li>
          <li>
            <Link href="/xmas">Xmas</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default MainNavigation;
