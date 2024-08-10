import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { SidebarContext } from '../contexts/SidebarContext'
import clsx from 'clsx'

export function ActionsMenu() {
  const { isGrouped, isAscending, startEditing, updateOptions } =
    useContext(SidebarContext)
  const [isFiltering, setIsFiltering] = useState(false)
  const filterRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const closeDialog = useCallback(
    (e: Event) => {
      if (!isFiltering) return

      const target = e.target as HTMLElement
      const isDropdown =
        dropdownRef.current === target || dropdownRef.current!.contains(target)
      const isFilterButton =
        filterRef.current === target || filterRef.current?.contains(target)

      if (isDropdown || isFilterButton) {
        return
      }

      setIsFiltering(false)
    },
    [isFiltering]
  )

  useEffect(function dialogCloseHandler() {
    window.addEventListener('click', closeDialog)

    return () => {
      window.removeEventListener('click', closeDialog)
    }
  }) // TODO: should use dep array

  return (
    <menu className="relative flex items-center justify-end gap-2 bg-gray-100">
      <button
        className="grid size-6 place-content-center rounded text-gray-500 transition-colors hover:bg-gray-300/70 hover:text-gray-800"
        onClick={() => startEditing()}
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
          <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
          <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
        </svg>
      </button>

      <button
        className="grid size-6 place-content-center rounded text-gray-500 transition-colors hover:bg-gray-300/70 hover:text-gray-800"
        ref={filterRef}
        onClick={() => setIsFiltering(true)}
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
          <path d="M14 2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2.172a2 2 0 0 0 .586 1.414l2.828 2.828A2 2 0 0 1 6 9.828v4.363a.5.5 0 0 0 .724.447l2.17-1.085A2 2 0 0 0 10 11.763V9.829a2 2 0 0 1 .586-1.414l2.828-2.828A2 2 0 0 0 14 4.172V2Z" />
        </svg>
      </button>

      <div
        id="filter-dropdown"
        ref={dropdownRef}
        className="absolute right-0 top-8 z-50 flex min-w-max select-none flex-col gap-2 rounded bg-white p-1 shadow-md [&[hidden]]:hidden"
        hidden={!isFiltering}
      >
        <div className="flex flex-col">
          <h3 className="px-2 font-semibold leading-6">View as</h3>

          <button
            className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-gray-200"
            onClick={() => updateOptions({ isGrouped: true, isAscending })}
          >
            <span>Group</span>

            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className={clsx('size-4 text-gray-500', {
                invisible: !isGrouped,
              })}
            >
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <button
            className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-gray-200"
            onClick={() => updateOptions({ isGrouped: false, isAscending })}
          >
            <span>List</span>

            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className={clsx('size-4 text-gray-500', {
                invisible: isGrouped,
              })}
            >
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <hr />

        <div className="flex flex-col">
          <h3 className="px-2 font-semibold leading-6">Sort order</h3>

          <button
            className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-gray-200"
            onClick={() => updateOptions({ isGrouped, isAscending: true })}
          >
            <span>Ascending</span>

            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className={clsx('size-4 text-gray-500', {
                invisible: !isAscending,
              })}
            >
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <button
            className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-gray-200"
            onClick={() => updateOptions({ isGrouped, isAscending: false })}
          >
            <span>Descending</span>

            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className={clsx('size-4 text-gray-500', {
                invisible: isAscending,
              })}
            >
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </menu>
  )
}
