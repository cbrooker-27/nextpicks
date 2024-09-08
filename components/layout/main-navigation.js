import Link from "next/link";
import Image from "next/image";
import SignIn from "../sign-in";
import SignOut from "../sign-out";
import {auth} from "@/auth"

import Logo from "./logo";
import classes from "./main-navigation.module.css";

async function MainNavigation() {

  const session = await auth();

  const loggedIn = session!=null

  return (
    <header className={classes.header}>
      <Link href="/">
        <Image src="/next.svg" width={50} height={50} alt="logo" />
        <Logo />
      </Link>
      {loggedIn&& "Welcome "+ session.user.name}
      <nav>
        <ul>
          <li>
            <Link href="/picks">Picks</Link>
          </li>
          <li>
            <Link href="/xmas">Xmas</Link>
          </li>
          {!loggedIn&&<li><SignIn/></li>}
          {loggedIn&&<li><SignOut/></li>}
        </ul>
      </nav>
    </header>
  );
}

export default MainNavigation;