'use client';

import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';
import { TextField } from './TextField';

type PasswordFieldProps = Omit<React.ComponentProps<typeof TextField>, 'type' | 'endAdornment'>;

/** A password input with a button to show or hide what was typed. */
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="rounded-full p-2 text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
