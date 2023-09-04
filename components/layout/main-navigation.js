'use client'
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

import Logo from "./logo";
import classes from "./main-navigation.module.css";

function MainNavigation() {
  const {data: session, status} = useSession();
  const loggedIn = status==="authenticated"
  console.log('loggedIn='+loggedIn)
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
          {!loggedIn&&<li><Link href="/signup">Login</Link></li>}
          {loggedIn&&<li><Link href="/logoff">Logout</Link></li>}
          
        </ul>
      </nav>
    </header>
  );
}

export default MainNavigation;
