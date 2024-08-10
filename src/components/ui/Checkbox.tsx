export function Checkbox({
  isChecked,
  isPartial,
}: {
  isChecked: boolean
  isPartial: boolean
}) {
  return (
    <div className="grid size-4 shrink-0 place-content-center rounded border border-current text-gray-500">
      {isChecked && <div className="size-2 rounded-sm bg-current"></div>}
      {isPartial && <div className="h-1 w-2 rounded-sm bg-current"></div>}
    </div>
  )
}
