import { signIn } from "@/auth"
 
export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("google", undefined,{prompt: "select_account"})
      }}
    >
      <button type="submit">Sign In</button>
    </form>
  )
} 