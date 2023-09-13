'use client'
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

import classes from "./footer.module.css";

export default function Footer() {
  
  return (
    <footer className={classes.footer}>
      I'm a little teapot
    </footer>
  );
}


