'use client';
import React from 'react';

const variantClass = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
  outline: 'btn btn-outline',
};

export default function Button({ variant = 'primary', className = '', as: Comp = 'button', children, ...props }) {
  const classes = `${variantClass[variant] || variantClass.primary} ${className}`.trim();
  const buttonProps =
    Comp === 'button'
      ? { type: props.type || 'button', ...props }
      : props;

  return (
    <Comp className={classes} {...buttonProps}>
      {children}
    </Comp>
  );
}

