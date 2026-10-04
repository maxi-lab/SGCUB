// Full-width row for the loading, error and empty states of a table.
// Renders nothing when the table has rows to show.
export default function TableMessageRow({ colSpan, isLoading = false, isEmpty = false, error, loadingText, errorText, emptyText }) {
  let message = null
  if (isLoading) message = loadingText
  else if (isEmpty) message = error ? errorText : emptyText
  if (!message) return null

  return (
    <tr>
      <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={colSpan}>
        {message}
      </td>
    </tr>
  )
}
