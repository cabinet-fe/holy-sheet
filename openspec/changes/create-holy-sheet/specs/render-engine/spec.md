## ADDED Requirements

### Requirement: SheetRenderer draws cells to Canvas

The system SHALL render cells to a Canvas 2D context with proper drawing order: grid lines → clear merge areas → backgrounds → content → borders.

#### Scenario: Draw grid lines

- **WHEN** rendering a viewport
- **THEN** horizontal and vertical grid lines are drawn for all visible rows and columns

#### Scenario: Clear merge cell interiors

- **WHEN** a merged cell spans multiple rows/columns
- **THEN** grid lines inside the merge area are cleared with clearRect

#### Scenario: Batch draw backgrounds by color

- **WHEN** multiple cells have the same background color
- **THEN** they are drawn in a single Path2D fill operation to reduce draw calls

### Requirement: Viewport manages virtual scrolling

The system SHALL implement virtual scrolling where only visible cells plus a buffer zone are rendered.

#### Scenario: Buffer zone around visible area

- **WHEN** viewport shows rows 10-30
- **THEN** rows 5-35 (with buffer of 5) are actually rendered

#### Scenario: Scroll to cell

- **WHEN** calling `scrollToCell(row, col)`
- **THEN** viewport scrolls to make that cell visible

#### Scenario: Detect scroll direction

- **WHEN** scrolling occurs
- **THEN** scroll direction (up/down/left/right) is detected for optimized rendering

### Requirement: DirtyRect tracks areas needing repaint

The system SHALL track dirty regions and only repaint affected areas instead of full canvas redraw.

#### Scenario: Mark region dirty

- **WHEN** a cell value changes
- **THEN** that cell's bounding rect is marked dirty

#### Scenario: Merge adjacent dirty regions

- **WHEN** multiple adjacent cells are dirty
- **THEN** dirty regions are merged to reduce clip operations

#### Scenario: Flush dirty regions

- **WHEN** `flush()` is called
- **THEN** only dirty regions are redrawn using canvas clip

### Requirement: Layered Canvas architecture

The system SHALL use separate Canvas layers: Main Layer for grid/content (dirty rect redraw), Selection Layer for selection highlight (frequent redraw), DOM Layer for events/input/scroll.

#### Scenario: Selection change only redraws selection layer

- **WHEN** user changes selection
- **THEN** only the Selection Canvas is redrawn, Main Canvas untouched

#### Scenario: Cell edit only redraws main layer

- **WHEN** a cell value changes
- **THEN** only the affected area of Main Canvas is redrawn

#### Scenario: Resize updates all layers

- **WHEN** container resizes
- **THEN** all Canvas layers resize and redraw

### Requirement: Scroll optimization using canvas copy

The system SHALL optimize scrolling by copying existing canvas content and only drawing newly visible areas.

#### Scenario: Scroll down optimization

- **WHEN** scrolling down by 100px
- **THEN** existing content is shifted up, only bottom 100px area is redrawn

#### Scenario: Large scroll triggers full redraw

- **WHEN** scroll distance exceeds viewport size
- **THEN** full redraw is performed instead of copy optimization

### Requirement: Text rendering with alignment and wrapping

The system SHALL render cell text with proper horizontal alignment (left/center/right), vertical alignment (top/middle/bottom), text wrapping, and rotation.

#### Scenario: Center aligned text

- **WHEN** cell has style `{ ha: 'center', va: 'middle' }`
- **THEN** text is centered both horizontally and vertically in cell

#### Scenario: Text wrapping

- **WHEN** cell has style `{ tw: true }` and long text
- **THEN** text wraps to multiple lines within cell bounds

#### Scenario: Rotated text

- **WHEN** cell has style `{ ta: 45 }`
- **THEN** text is rotated 45 degrees

### Requirement: Row and column headers rendering

The system SHALL render row headers (1, 2, 3...) and column headers (A, B, C...) in fixed areas that don't scroll with content.

#### Scenario: Column header labels

- **WHEN** rendering column headers
- **THEN** labels A, B, C... AA, AB... are displayed

#### Scenario: Row header labels

- **WHEN** rendering row headers
- **THEN** labels 1, 2, 3... are displayed

#### Scenario: Headers scroll with content

- **WHEN** scrolling horizontally
- **THEN** column headers scroll, row headers stay fixed
