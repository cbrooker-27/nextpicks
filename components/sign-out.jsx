import { siteSignOut } from "@/auth";

export default function SignOut() {
  return (
    <form
      action={async () => {
        return await siteSignOut();
      }}
    >
      <button type="submit">Sign Out</button>
    </form>
  );
}
