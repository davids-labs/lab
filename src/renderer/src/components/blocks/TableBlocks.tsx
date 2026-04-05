import { useEffect, useMemo, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { ulid } from 'ulidx'
import type { Block, BomData, BomItem, SpecTableData } from '@preload/types'
import { InputField } from '@renderer/components/ui/InputField'
import { usePersistBlock } from '@renderer/hooks/usePersistBlock'
import styles from './BlockEditors.module.css'

function moveListItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) {
    return items
  }

  return arrayMove(items, from, to)
}

function parseDelimitedRows(raw: string): string[][] {
  const rows: string[][] = []
  const lines = raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0)

  if (lines.length === 0) {
    return rows
  }

  const delimiter =
    ['\t', ',', ';']
      .map((entry) => ({
        delimiter: entry,
        score: lines[0].split(entry).length - 1
      }))
      .sort((left, right) => right.score - left.score)[0]?.delimiter ?? ','

  for (const line of lines) {
    const cells: string[] = []
    let current = ''
    let inQuotes = false

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index]
      const nextChar = line[index + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          index += 1
        } else {
          inQuotes = !inQuotes
        }
        continue
      }

      if (!inQuotes && char === delimiter) {
        cells.push(current.trim())
        current = ''
        continue
      }

      current += char
    }

    cells.push(current.trim())
    rows.push(cells)
  }

  return rows
}

function looksLikeBomHeader(row: string[]): boolean {
  const normalized = row.map((cell) => cell.toLowerCase())
  return normalized.some((cell) => ['item', 'part', 'name'].includes(cell))
}

function createBomItem(values?: Partial<BomItem>): BomItem {
  return {
    id: ulid(),
    item: values?.item ?? '',
    detail: values?.detail ?? '',
    qty: values?.qty ?? 1,
    cost: values?.cost ?? ''
  }
}

interface BomBlockProps {
  block: Block<BomData>
}

export function BomBlock({ block }: BomBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  const itemCount = draft.items.filter((item) => item.item || item.detail || item.cost).length
  const totalQuantity = useMemo(
    () => draft.items.reduce((sum, item) => sum + (Number.isFinite(item.qty) ? item.qty : 0), 0),
    [draft.items]
  )

  function updateItem(index: number, changes: Partial<BomItem>): void {
    setDraft((current) => ({
      items: current.items.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...changes } : entry
      )
    }))
  }

  function addRow(afterIndex?: number): void {
    setDraft((current) => {
      const nextItem = createBomItem()

      if (afterIndex === undefined || afterIndex < 0 || afterIndex >= current.items.length) {
        return {
          items: [...current.items, nextItem]
        }
      }

      return {
        items: [
          ...current.items.slice(0, afterIndex + 1),
          nextItem,
          ...current.items.slice(afterIndex + 1)
        ]
      }
    })
  }

  async function handleImport(): Promise<void> {
    const [filePath] = await window.lab.system.openFiles({
      title: 'Import BOM CSV',
      filters: [
        { name: 'Delimited text', extensions: ['csv', 'tsv', 'txt'] },
        { name: 'All files', extensions: ['*'] }
      ]
    })

    if (!filePath) {
      return
    }

    const raw = await window.lab.system.readTextFile(filePath)
    const rows = parseDelimitedRows(raw)

    if (rows.length === 0) {
      setImportMessage('The selected file did not contain any rows.')
      return
    }

    const dataRows = looksLikeBomHeader(rows[0]) ? rows.slice(1) : rows
    const items = dataRows
      .filter((row) => row.some((cell) => cell.trim().length > 0))
      .map((row) =>
        createBomItem({
          item: row[0] ?? '',
          detail: row[1] ?? '',
          qty: Number(row[2]) || 1,
          cost: row[3] ?? ''
        })
      )

    if (items.length === 0) {
      setImportMessage('No usable BOM rows were found in that file.')
      return
    }

    setDraft({ items })
    setImportMessage(`Imported ${items.length} BOM row${items.length === 1 ? '' : 's'}.`)
  }

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>Bill of materials</strong>
          <div className={styles.helperText}>Track line items, quantities, and quick costing.</div>
        </div>
        <div className={styles.inlineActions}>
          <button className={styles.smallButton} onClick={() => void handleImport()} type="button">
            Import CSV
          </button>
          <button className={styles.smallButton} onClick={() => addRow()} type="button">
            Add Row
          </button>
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Rows</span>
          <strong className={styles.statValue}>{itemCount}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Qty</span>
          <strong className={styles.statValue}>{totalQuantity}</strong>
        </div>
      </div>

      {importMessage ? <div className={styles.helperText}>{importMessage}</div> : null}

      {draft.items.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Detail</th>
                <th>Qty</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {draft.items.map((item, index) => (
                <tr key={item.id || index}>
                  <td>
                    <InputField
                      placeholder="Motor driver"
                      value={item.item}
                      onChange={(event) => updateItem(index, { item: event.target.value })}
                    />
                  </td>
                  <td>
                    <InputField
                      placeholder="Supplier or part note"
                      value={item.detail}
                      onChange={(event) => updateItem(index, { detail: event.target.value })}
                    />
                  </td>
                  <td>
                    <InputField
                      inputMode="numeric"
                      placeholder="1"
                      value={String(item.qty)}
                      onChange={(event) =>
                        updateItem(index, {
                          qty: Math.max(0, Number(event.target.value) || 0)
                        })
                      }
                    />
                  </td>
                  <td>
                    <InputField
                      placeholder="$19.00"
                      value={item.cost ?? ''}
                      onChange={(event) => updateItem(index, { cost: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && index === draft.items.length - 1) {
                          event.preventDefault()
                          addRow(index)
                        }
                      }}
                    />
                  </td>
                  <td>
                    <div className={styles.inlineActions}>
                      <button
                        className={`${styles.smallButton} ${styles.iconButton}`}
                        disabled={index === 0}
                        onClick={() =>
                          setDraft((current) => ({
                            items: moveListItem(current.items, index, index - 1)
                          }))
                        }
                        type="button"
                      >
                        Up
                      </button>
                      <button
                        className={`${styles.smallButton} ${styles.iconButton}`}
                        disabled={index === draft.items.length - 1}
                        onClick={() =>
                          setDraft((current) => ({
                            items: moveListItem(current.items, index, index + 1)
                          }))
                        }
                        type="button"
                      >
                        Down
                      </button>
                      <button
                        className={styles.smallButton}
                        onClick={() => addRow(index)}
                        type="button"
                      >
                        Add
                      </button>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          Start with an empty row or import a CSV/TSV to populate this block.
        </div>
      )}
    </div>
  )
}

interface SpecTableBlockProps {
  block: Block<SpecTableData>
}

function normaliseSpecRows(rows: string[][], columnCount: number): string[][] {
  return rows.map((row) => {
    const nextRow = [...row]

    if (nextRow.length < columnCount) {
      nextRow.push(...new Array(columnCount - nextRow.length).fill(''))
    }

    return nextRow.slice(0, columnCount)
  })
}

export function SpecTableBlock({ block }: SpecTableBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)

  useEffect(
    () =>
      setDraft({
        ...block.data,
        rows: normaliseSpecRows(block.data.rows, block.data.headers.length)
      }),
    [block.data, block.id, block.updated_at]
  )
  usePersistBlock(block, draft)

  function updateHeader(index: number, value: string): void {
    setDraft((current) => ({
      ...current,
      headers: current.headers.map((entry, entryIndex) => (entryIndex === index ? value : entry))
    }))
  }

  function updateCell(rowIndex: number, cellIndex: number, value: string): void {
    setDraft((current) => ({
      ...current,
      rows: normaliseSpecRows(current.rows, current.headers.length).map((entry, entryIndex) =>
        entryIndex === rowIndex
          ? entry.map((cell, entryCellIndex) => (entryCellIndex === cellIndex ? value : cell))
          : entry
      )
    }))
  }

  function addColumn(): void {
    setDraft((current) => ({
      ...current,
      headers: [...current.headers, `Column ${current.headers.length + 1}`],
      rows: current.rows.map((row) => [...row, ''])
    }))
  }

  function removeColumn(index: number): void {
    setDraft((current) => {
      if (current.headers.length <= 1) {
        return current
      }

      return {
        ...current,
        headers: current.headers.filter((_, entryIndex) => entryIndex !== index),
        rows: current.rows.map((row) => row.filter((_, entryIndex) => entryIndex !== index))
      }
    })
  }

  function addRow(afterIndex?: number): void {
    setDraft((current) => {
      const nextRow = new Array(current.headers.length).fill('')

      if (afterIndex === undefined || afterIndex < 0 || afterIndex >= current.rows.length) {
        return {
          ...current,
          rows: [...current.rows, nextRow]
        }
      }

      return {
        ...current,
        rows: [
          ...current.rows.slice(0, afterIndex + 1),
          nextRow,
          ...current.rows.slice(afterIndex + 1)
        ]
      }
    })
  }

  const rows = useMemo(
    () => normaliseSpecRows(draft.rows, draft.headers.length),
    [draft.headers.length, draft.rows]
  )

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>Specification table</strong>
          <div className={styles.helperText}>
            Keep dimensions, constraints, and technical fields in a structured grid.
          </div>
        </div>
        <div className={styles.inlineActions}>
          <button className={styles.smallButton} onClick={() => addColumn()} type="button">
            Add Column
          </button>
          <button className={styles.smallButton} onClick={() => addRow()} type="button">
            Add Row
          </button>
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Columns</span>
          <strong className={styles.statValue}>{draft.headers.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Rows</span>
          <strong className={styles.statValue}>{rows.length}</strong>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {draft.headers.map((header, index) => (
                <th key={`${header}-${index}`}>
                  <div className={styles.stack}>
                    <InputField
                      placeholder={`Column ${index + 1}`}
                      value={header}
                      onChange={(event) => updateHeader(index, event.target.value)}
                    />
                    <button
                      className={styles.smallButton}
                      disabled={draft.headers.length <= 1}
                      onClick={() => removeColumn(index)}
                      type="button"
                    >
                      Remove Column
                    </button>
                  </div>
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`cell-${rowIndex}-${cellIndex}`}>
                    <InputField
                      placeholder={draft.headers[cellIndex] || `Column ${cellIndex + 1}`}
                      value={cell}
                      onChange={(event) => updateCell(rowIndex, cellIndex, event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' &&
                          rowIndex === rows.length - 1 &&
                          cellIndex === row.length - 1
                        ) {
                          event.preventDefault()
                          addRow(rowIndex)
                        }
                      }}
                    />
                  </td>
                ))}
                <td>
                  <div className={styles.inlineActions}>
                    <button
                      className={`${styles.smallButton} ${styles.iconButton}`}
                      disabled={rowIndex === 0}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          rows: moveListItem(
                            normaliseSpecRows(current.rows, current.headers.length),
                            rowIndex,
                            rowIndex - 1
                          )
                        }))
                      }
                      type="button"
                    >
                      Up
                    </button>
                    <button
                      className={`${styles.smallButton} ${styles.iconButton}`}
                      disabled={rowIndex === rows.length - 1}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          rows: moveListItem(
                            normaliseSpecRows(current.rows, current.headers.length),
                            rowIndex,
                            rowIndex + 1
                          )
                        }))
                      }
                      type="button"
                    >
                      Down
                    </button>
                    <button
                      className={styles.smallButton}
                      onClick={() => addRow(rowIndex)}
                      type="button"
                    >
                      Add
                    </button>
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
