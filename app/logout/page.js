import SignOut from "@/components/sign-out";
import classes from "./page.module.css";

export default function Login() {
  return (
    <section className={classes.auth}>
      <SignOut />
    </section>
  );
}
