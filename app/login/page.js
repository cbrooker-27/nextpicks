'use client'
import Google from "next-auth/providers/google"

import { signIn } from "next-auth/react"



export default function SignIn() {
  function clickHandler(){
    signIn(Google.id)
  }

  return (
    <>
        <div key={Google.name}>
          <button onClick={clickHandler}>
            Sign in with {Google.name}
          </button>
        </div>
    </>
  )
}