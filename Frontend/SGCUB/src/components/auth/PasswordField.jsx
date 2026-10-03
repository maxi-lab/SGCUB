import { useState } from 'react'

export default function PasswordField({ id, label, value, onChange, placeholder = '••••••••', ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="flex flex-col gap-2 text-left text-base my-space-xl">
      <label className="text-base text-label-md font-label-md text-on-surface font-semibold" htmlFor={id}>
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3 text-outline text-title-md pointer-events-none select-none">
          lock
        </span>
        <input
          className="w-full h-11 pl-10 pr-11 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg outline-none transition-all placeholder:text-outline-variant focus:ring-2 focus:ring-primary-container focus:bg-white shadow-sm"
          id={id}
          placeholder={placeholder}
          type={isVisible ? 'text' : 'password'}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...inputProps}
        />
        <button
          className="absolute right-2 p-1.5 text-outline hover:text-on-surface rounded transition-colors flex items-center justify-center focus:outline-none"
          title="Mostrar u ocultar contraseña"
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
        >
          <span className="material-symbols-outlined text-title-md">
            {isVisible ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>
  )
}
