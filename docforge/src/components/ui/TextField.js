import React from 'react';

export default function TextField({
  label,
  type = 'text',
  hint,
  wrapperClassName = '',
  inputClassName = '',
  ...inputProps
}) {
  return (
    <label className={`form-field ${wrapperClassName}`}>
      <span className="form-field__label">{label}</span>
      <input type={type} className={`form-field__input ${inputClassName}`} {...inputProps} />
      {hint && <span className="form-field__hint">{hint}</span>}
    </label>
  );
}

