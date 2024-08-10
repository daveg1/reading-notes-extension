export function Checkbox({ isChecked }: { isChecked: boolean }) {
  return (
    <div className="grid size-4 shrink-0 place-content-center rounded border border-current text-gray-500">
      {isChecked && <div className="size-2 rounded-sm bg-current"></div>}
    </div>
  )
}
