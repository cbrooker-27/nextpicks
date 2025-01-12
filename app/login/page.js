"use client";

import { useRef } from "react";
import { credsSignIn, googleSignIn } from "@/lib/auth";

import classes from "./page.module.css";

export default function Login() {
  const nameInputRef = useRef();
  const passwordInputRef = useRef();

  async function submitHandler(event) {
    event.preventDefault();

    const enteredName = nameInputRef.current.value;
    const enteredPassword = passwordInputRef.current.value;

    // optional: Add validation

    console.log("attempting sign-in");
    const result = await credsSignIn("credentials", {
      redirect: false,
      name: enteredName,
      password: enteredPassword,
    });
    console.log(result);
  }

  return (
    <section className={classes.auth}>
      <form action={googleSignIn} className={classes.actions}>
        <button type="submit">Sign In with Google</button>
      </form>
      <h1>Login with username / password (less secure)</h1>
      <form onSubmit={submitHandler}>
        <div className={classes.control}>
          <label htmlFor="name">Your Name</label>
          <input type="text" id="name" required ref={nameInputRef} />
        </div>
        <div className={classes.control}>
          <label htmlFor="password">Your Password</label>
          <input
            type="password"
            id="password"
            required
            ref={passwordInputRef}
          />
        </div>
        <div className={classes.actions}>
          <button>Login</button>
        </div>
      </form>
    </section>
  );
}
