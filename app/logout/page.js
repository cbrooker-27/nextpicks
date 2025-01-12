import { siteSignOut } from "@/lib/auth";
import classes from "./page.module.css";

export default function Logout() {
  return (
    <section className={classes.auth}>
      <form action={siteSignOut} className={classes.actions}>
        <button type="submit">Sign Out</button>
      </form>
    </section>
  );
}
