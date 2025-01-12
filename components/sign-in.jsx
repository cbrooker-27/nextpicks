import { signIn } from "@/auth";
import { credsSignIn, googleSignIn } from "@/lib/auth";

export default function SignIn() {
  return (
    <>
      <form action={googleSignIn}>
        <button type="submit">Sign In</button>
      </form>
      <form
        action={async (formData) => {
          credsSignIn(formData);
        }}
      >
        <label>
          Email
          <input name="email" type="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" />
        </label>
        <button>Sign In</button>
      </form>
    </>
  );
}
