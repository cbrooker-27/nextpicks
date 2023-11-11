'use client'

import { useRef } from 'react';

import classes from './page.module.css';

async function createUser(name, password) {
    console.log('name:'+name)
  const response = await fetch('/api/picks/signup', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong!');
  }

  return data;
}

function SignUp() {
  const nameInputRef = useRef();
  const passwordInputRef = useRef();

  async function submitHandler(event) {
    event.preventDefault();

    const enteredName = nameInputRef.current.value;
    const enteredPassword = passwordInputRef.current.value;

    // optional: Add validation

      try {
        const result = await createUser(enteredName, enteredPassword);
        console.log(result);
      } catch (error) {
        console.log(error);
      }
  }

  return (
    <section className={classes.auth}>
      <h1>Sign Up</h1>
      <form onSubmit={submitHandler}>
        <div className={classes.control}>
          <label htmlFor='name'>Your Name</label>
          <input type='text' id='name' required ref={nameInputRef} />
        </div>
        <div className={classes.control}>
          <label htmlFor='password'>Your Password</label>
          <input
            type='password'
            id='password'
            required
            ref={passwordInputRef}
          />
        </div>
        <div className={classes.actions}>
          <button>Create Account</button>
        </div>
      </form>
    </section>
  );
}

export default SignUp;
