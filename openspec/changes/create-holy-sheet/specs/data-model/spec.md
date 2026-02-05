## ADDED Requirements

### Requirement: CellData structure supports minimal storage

The system SHALL store cell data using a minimal interface with single-letter property names to reduce JSON serialization size. Properties include: `v` (value), `s` (style), `t` (type), `f` (formula), `si` (shared formula id), `p` (rich text), `custom` (plugin extensions).

#### Scenario: Store cell with value only

- **WHEN** a cell contains only a numeric value 42
- **THEN** the cell data is stored as `{ v: 42 }`

#### Scenario: Store cell with formula

- **WHEN** a cell contains formula "=SUM(A1:A10)"
- **THEN** the cell data includes `{ f: "=SUM(A1:A10)" }` alongside computed value

#### Scenario: Store cell with custom plugin data

- **WHEN** a plugin needs to store metadata on a cell
- **THEN** the data is stored in `custom` field without polluting core properties

### Requirement: Sheet uses sparse matrix storage

The system SHALL store cell data in a sparse matrix structure `Record<number, Record<number, CellData>>` where only non-empty cells consume memory.

#### Scenario: Empty cells do not consume memory

- **WHEN** a sheet has 1 million rows but only 100 cells with data
- **THEN** only 100 CellData objects exist in memory

#### Scenario: Access empty cell returns null

- **WHEN** calling `getCell(row, col)` on an empty position
- **THEN** the method returns `null`

### Requirement: Workbook manages multiple sheets

The system SHALL support a Workbook containing multiple Sheets with operations: addSheet, deleteSheet, renameSheet, moveSheet, getSheet, setActiveSheet.

#### Scenario: Add new sheet

- **WHEN** calling `workbook.addSheet("Sales")`
- **THEN** a new sheet named "Sales" is created and added to the workbook

#### Scenario: Delete sheet

- **WHEN** calling `workbook.deleteSheet(sheetId)`
- **THEN** the sheet is removed from the workbook

#### Scenario: Reorder sheets

- **WHEN** calling `workbook.moveSheet(sheetId, newIndex)`
- **THEN** the sheet order is updated accordingly

### Requirement: StylePool provides shared style management

The system SHALL deduplicate styles through a StylePool that returns the same StyleId for identical style objects.

#### Scenario: Duplicate styles return same ID

- **WHEN** adding two identical CellStyle objects to StylePool
- **THEN** both return the same StyleId

#### Scenario: Style lookup by ID

- **WHEN** calling `stylePool.get(styleId)`
- **THEN** the original CellStyle object is returned

#### Scenario: Merge styles creates new combined style

- **WHEN** calling `stylePool.merge(baseId, { bg: '#ff0000' })`
- **THEN** a new StyleId is returned combining base style with override

### Requirement: MergeIndex supports fast merge cell queries

The system SHALL maintain a MergeIndex for O(k) lookup of merge cells at any position, where k is the number of merges in that row.

#### Scenario: Query merge at position

- **WHEN** calling `mergeIndex.getMergeAt(row, col)` on a merged cell
- **THEN** the MergeCell object containing that position is returned

#### Scenario: Check if cell is master

- **WHEN** calling `mergeIndex.isMasterCell(row, col)` on the top-left cell of a merge
- **THEN** the method returns `true`

#### Scenario: Get merges in viewport

- **WHEN** calling `mergeIndex.getMergesInViewport(sr, er, sc, ec)`
- **THEN** all MergeCell objects overlapping the viewport are returned

### Requirement: CellStyle supports comprehensive formatting

The system SHALL support cell styles including: font (family, size, color, bold, italic, underline, strikethrough), alignment (horizontal, vertical, text angle, wrap), background color, borders (top/right/bottom/left with style and color), number format.

#### Scenario: Apply bold and background color

- **WHEN** setting style `{ b: true, bg: '#ffff00' }`
- **THEN** the cell displays bold text with yellow background

#### Scenario: Apply border style

- **WHEN** setting style with `bd: { t: { s: 'thin', c: '#000000' } }`
- **THEN** the cell displays a thin black top border

### Requirement: RichText supports mixed formatting within cell

The system SHALL support rich text data with multiple TextRuns, each having independent text style.

#### Scenario: Mixed bold and italic text

- **WHEN** a cell contains RichTextData with runs `[{ t: 'Hello ', s: { b: true } }, { t: 'World', s: { i: true } }]`
- **THEN** "Hello " renders bold and "World" renders italic
