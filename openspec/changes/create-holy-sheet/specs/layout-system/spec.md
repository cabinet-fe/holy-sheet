## ADDED Requirements

### Requirement: IndexMapper handles logical-physical index conversion

The system SHALL maintain segment-based mapping between logical indices (what user sees) and physical indices (data storage position) to handle row/column insertions and deletions without moving actual data.

#### Scenario: Initial state maps directly

- **WHEN** no insertions or deletions have occurred
- **THEN** `toPhysical(n)` returns `n` for any index

#### Scenario: Insert rows updates mapping

- **WHEN** 3 rows are inserted at position 5
- **THEN** `toPhysical(8)` returns `5` (the original row 5)

#### Scenario: Delete rows updates mapping

- **WHEN** rows 3-5 are deleted
- **THEN** `toPhysical(3)` returns `6` (what was originally row 6)

### Requirement: AccumulatorCache provides fast offset lookup

The system SHALL cache row/column offsets in blocks of 1000 to achieve O(log b + blockSize) lookup complexity for pixel-to-index conversion.

#### Scenario: Get row offset

- **WHEN** calling `getOffset(rowIndex)`
- **THEN** the cumulative pixel offset from row 0 to that row is returned

#### Scenario: Get index at pixel offset

- **WHEN** calling `getIndexAtOffset(500)` where row heights are 20px each
- **THEN** row index 25 is returned

#### Scenario: Partial invalidation on height change

- **WHEN** row 500's height changes
- **THEN** only blocks from row 500 onwards are invalidated

### Requirement: HiddenRanges tracks hidden rows and columns

The system SHALL track hidden rows/columns with automatic storage mode switching: Set for < 100 items, compressed intervals for >= 100 items.

#### Scenario: Hide single row

- **WHEN** calling `hiddenRows.hide(5)`
- **THEN** `isHidden(5)` returns `true`

#### Scenario: Hide range of rows

- **WHEN** calling `hiddenRows.hideRange(10, 20)`
- **THEN** all rows 10-20 report as hidden

#### Scenario: Storage compression on threshold

- **WHEN** more than 100 rows are hidden
- **THEN** storage automatically compresses to interval representation

### Requirement: LayoutManager provides unified layout queries

The system SHALL provide a LayoutManager that combines IndexMapper, AccumulatorCache, and HiddenRanges to answer layout queries.

#### Scenario: Get cell at pixel point

- **WHEN** calling `getCellAtPoint(x, y)` with pixel coordinates
- **THEN** the corresponding `{ row, col }` is returned

#### Scenario: Get visible range for viewport

- **WHEN** calling `getVisibleRange(scroll, size)` with scroll position and viewport size
- **THEN** a ViewRange `{ startRow, endRow, startCol, endCol }` is returned

#### Scenario: Set row height

- **WHEN** calling `setRowHeight(row, 40)`
- **THEN** the row height is updated and cache invalidated

### Requirement: LayoutManager supports batch operations via transaction

The system SHALL support transaction mode where multiple layout changes are batched and cache is only rebuilt once at commit.

#### Scenario: Batch resize multiple rows

- **WHEN** `beginTransaction()`, resize 100 rows, `endTransaction()`
- **THEN** cache rebuild happens only once after endTransaction

#### Scenario: Insert multiple rows in transaction

- **WHEN** multiple `insertRows` calls within a transaction
- **THEN** all insertions are applied atomically with single cache rebuild

### Requirement: Default row height and column width

The system SHALL provide configurable default row height (20px) and column width (80px) for cells without explicit sizing.

#### Scenario: Get default row height

- **WHEN** calling `getRowHeight(row)` on a row without custom height
- **THEN** the default row height (20) is returned

#### Scenario: Get custom column width

- **WHEN** column 5 has custom width 120
- **THEN** `getColWidth(5)` returns 120 while other columns return 80
