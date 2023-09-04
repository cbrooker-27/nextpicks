'use client'
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

import Logo from "./logo";
import classes from "./main-navigation.module.css";

function MainNavigation() {
  const {data: session, status} = useSession();

  function logoutHandler(){
    signOut();
  }

  const loggedIn = status==="authenticated"
  console.log('loggedIn='+loggedIn)
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
          {!loggedIn&&<li><Link href="/signup">Login</Link></li>}
          {loggedIn&&<li><button onClick={logoutHandler} >Logout</button></li>}
          
        </ul>
      </nav>
    </header>
  );
}

export default MainNavigation;
