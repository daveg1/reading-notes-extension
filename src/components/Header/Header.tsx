import { useContext } from 'react'
import './Header.css'
import { SidebarContext } from '../../contexts/SidebarContext'

export function Header() {
  const { isGrouped, isAscending, updateOptions } = useContext(SidebarContext)

  return (
    <header className="header">
      <h2 className="header__text">Your notes</h2>

      <div className="header__actions">
        <button
          id="button-grouped"
          className="button button--text"
          onClick={() => updateOptions({ isGrouped: !isGrouped, isAscending })}
        >
          [{isGrouped ? 'X' : ' '}] grouped
        </button>

        <button
          id="button-sort"
          className="button button--icon"
          onClick={() =>
            updateOptions({ isGrouped, isAscending: !isAscending })
          }
        >
          {isAscending && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                className="sort-down"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25"
              />
            </svg>
          )}

          {!isAscending && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                className="sort-up"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
