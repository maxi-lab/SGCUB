import { Link } from 'react-router-dom'

export function LoadingFile({ text }) {
  return (
    <div className="w-full py-16 flex flex-col items-center gap-3 text-on-surface-variant">
      <span className="material-symbols-outlined text-[28px] animate-spin">progress_activity</span>
      <p className="text-base">{text}</p>
    </div>
  )
}

export function ErrorFile({ message, BackTo, BackText }) {
  return (
    <div className="w-full space-y-4 pt-2">
      <Link
        to={BackTo}
        className="inline-flex items-center gap-1.5 text-base font-medium text-on-surface-variant hover:text-primary px-3 py-1.5 rounded transition-colors bg-surface-container-lowest border border-outline-variant/30"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        <span>{BackText}</span>
      </Link>
      <div className="bg-error-container text-on-error-container p-4 rounded-lg border border-error/30 flex items-center gap-2.5" role="alert">
        <span className="material-symbols-outlined text-error">error</span>
        <p className="text-base font-medium">{message}</p>
      </div>
    </div>
  )
}
