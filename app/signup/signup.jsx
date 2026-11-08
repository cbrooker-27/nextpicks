'use client'

import { useRef, useState } from 'react';

import classes from './page.module.css';

async function createUser(name, password) {
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
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  async function submitHandler(event) {
    event.preventDefault();

    const enteredName = nameInputRef.current.value;
    const enteredPassword = passwordInputRef.current.value;

    setMessage('');
    setHasError(false);
    try {
      await createUser(enteredName, enteredPassword);
      setMessage('Account created successfully.');
    } catch (error) {
      setHasError(true);
      setMessage(error instanceof Error ? error.message : 'Unable to create account.');
    }
  }

  return (
    <section className={classes.auth}>
      <h1>Sign Up</h1>
      <form onSubmit={submitHandler}>
        {message && <p role={hasError ? 'alert' : 'status'}>{message}</p>}
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
