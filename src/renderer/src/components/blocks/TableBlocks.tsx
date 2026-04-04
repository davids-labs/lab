import { useEffect, useState } from 'react'
import { ulid } from 'ulidx'
import type { Block, BomData, SpecTableData } from '@preload/types'
import { InputField } from '@renderer/components/ui/InputField'
import { usePersistBlock } from '@renderer/hooks/usePersistBlock'
import styles from './BlockEditors.module.css'

interface BomBlockProps {
  block: Block<BomData>
}

export function BomBlock({ block }: BomBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  return (
    <div className={styles.stack}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Detail</th>
            <th>Qty</th>
            <th>Cost</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {draft.items.map((item, index) => (
            <tr key={item.id || index}>
              <td>
                <InputField
                  value={item.item}
                  onChange={(event) =>
                    setDraft((current) => ({
                      items: current.items.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, item: event.target.value } : entry
                      )
                    }))
                  }
                />
              </td>
              <td>
                <InputField
                  value={item.detail}
                  onChange={(event) =>
                    setDraft((current) => ({
                      items: current.items.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, detail: event.target.value } : entry
                      )
                    }))
                  }
                />
              </td>
              <td>
                <InputField
                  value={String(item.qty)}
                  onChange={(event) =>
                    setDraft((current) => ({
                      items: current.items.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, qty: Number(event.target.value) || 0 }
                          : entry
                      )
                    }))
                  }
                />
              </td>
              <td>
                <InputField
                  value={item.cost ?? ''}
                  onChange={(event) =>
                    setDraft((current) => ({
                      items: current.items.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, cost: event.target.value } : entry
                      )
                    }))
                  }
                />
              </td>
              <td>
                <button
                  className={styles.smallButton}
                  onClick={() =>
                    setDraft((current) => ({
                      items: current.items.filter((_, entryIndex) => entryIndex !== index)
                    }))
                  }
                  type="button"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className={styles.smallButton}
        onClick={() =>
          setDraft((current) => ({
            items: [...current.items, { id: ulid(), item: '', detail: '', qty: 1, cost: '' }]
          }))
        }
        type="button"
      >
        Add Row
      </button>
    </div>
  )
}

interface SpecTableBlockProps {
  block: Block<SpecTableData>
}

export function SpecTableBlock({ block }: SpecTableBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  return (
    <div className={styles.stack}>
      <table className={styles.table}>
        <thead>
          <tr>
            {draft.headers.map((header, index) => (
              <th key={`${header}-${index}`}>
                <InputField
                  value={header}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      headers: current.headers.map((entry, entryIndex) =>
                        entryIndex === index ? event.target.value : entry
                      )
                    }))
                  }
                />
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {draft.rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>
                  <InputField
                    value={cell}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        rows: current.rows.map((entry, entryIndex) =>
                          entryIndex === rowIndex
                            ? entry.map((rowCell, rowCellIndex) =>
                                rowCellIndex === cellIndex ? event.target.value : rowCell
                              )
                            : entry
                        )
                      }))
                    }
                  />
                </td>
              ))}
              <td>
                <button
                  className={styles.smallButton}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      rows: current.rows.filter((_, entryIndex) => entryIndex !== rowIndex)
                    }))
                  }
                  type="button"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.row}>
        <button
          className={styles.smallButton}
          onClick={() =>
            setDraft((current) => ({
              ...current,
              headers: [...current.headers, `Column ${current.headers.length + 1}`],
              rows: current.rows.map((row) => [...row, ''])
            }))
          }
          type="button"
        >
          Add Column
        </button>
        <button
          className={styles.smallButton}
          onClick={() =>
            setDraft((current) => ({
              ...current,
              rows: [...current.rows, new Array(current.headers.length).fill('')]
            }))
          }
          type="button"
        >
          Add Row
        </button>
      </div>
    </div>
  )
}
