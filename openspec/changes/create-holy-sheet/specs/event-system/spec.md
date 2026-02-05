## ADDED Requirements

### Requirement: EventEmitter provides publish-subscribe messaging

The system SHALL provide an EventEmitter for internal communication with on/off/emit/once methods.

#### Scenario: Subscribe to event

- **WHEN** calling `emitter.on('cell:click', callback)`
- **THEN** callback is invoked when 'cell:click' is emitted

#### Scenario: Unsubscribe from event

- **WHEN** calling the returned unsubscribe function
- **THEN** callback is no longer invoked on future emits

#### Scenario: Once subscription

- **WHEN** calling `emitter.once('event', callback)`
- **THEN** callback fires only on first emit, then auto-unsubscribes

### Requirement: InteractionManager implements state machine

The system SHALL manage interaction states: idle, selecting, rowResizing, colResizing, filling, editing. Only valid state transitions are allowed.

#### Scenario: Start selection from idle

- **WHEN** mouse down on cell in idle state
- **THEN** state transitions to 'selecting' with start position recorded

#### Scenario: End selection

- **WHEN** mouse up during selecting state
- **THEN** state transitions back to 'idle' and selection is finalized

#### Scenario: Start editing from idle

- **WHEN** double-click on cell or start typing in idle state
- **THEN** state transitions to 'editing'

#### Scenario: Start row resizing

- **WHEN** mouse down on row header border
- **THEN** state transitions to 'rowResizing' with initial height recorded

### Requirement: SelectionManager handles cell selection

The system SHALL manage single and multiple selections with support for Ctrl+click (add range), Shift+click (extend range), and keyboard navigation.

#### Scenario: Single cell selection

- **WHEN** clicking on cell A1
- **THEN** selection contains only A1

#### Scenario: Range selection by drag

- **WHEN** dragging from A1 to C3
- **THEN** selection contains range A1:C3

#### Scenario: Add selection with Ctrl+click

- **WHEN** Ctrl+clicking on D5 while A1:B2 is selected
- **THEN** selections contain both A1:B2 and D5

#### Scenario: Extend selection with Shift+click

- **WHEN** Shift+clicking on C3 while A1 is selected
- **THEN** selection extends to A1:C3

#### Scenario: Selection expands for merge cells

- **WHEN** selecting a cell that is part of a merge
- **THEN** selection automatically expands to cover entire merge area

### Requirement: KeyboardHandler manages keyboard navigation

The system SHALL handle keyboard navigation: arrow keys (move), Tab/Enter (move and confirm), Ctrl+arrow (jump to edge), Shift+arrow (extend selection).

#### Scenario: Arrow key moves selection

- **WHEN** pressing Down arrow with A1 selected
- **THEN** selection moves to A2

#### Scenario: Tab moves to next cell

- **WHEN** pressing Tab
- **THEN** selection moves to next cell in row, or first cell of next row

#### Scenario: Ctrl+arrow jumps to edge

- **WHEN** pressing Ctrl+Down
- **THEN** selection jumps to last non-empty cell in column or sheet edge

#### Scenario: Shift+arrow extends selection

- **WHEN** pressing Shift+Right
- **THEN** selection extends one column to the right

### Requirement: TouchHandler supports mobile gestures

The system SHALL support touch gestures: tap (select), double-tap (edit), long-press (context menu), swipe (scroll with inertia), pinch (zoom).

#### Scenario: Tap to select

- **WHEN** tapping on a cell
- **THEN** that cell is selected

#### Scenario: Double-tap to edit

- **WHEN** double-tapping on a cell
- **THEN** cell enters edit mode

#### Scenario: Long-press shows context menu

- **WHEN** pressing and holding for 500ms
- **THEN** context menu appears

#### Scenario: Swipe with inertia

- **WHEN** swiping quickly
- **THEN** scroll continues with decelerating inertia

### Requirement: CellEditor handles text input

The system SHALL provide a CellEditor that positions an input element over the active cell, handles IME composition, and commits/cancels on Enter/Escape.

#### Scenario: Show editor on cell

- **WHEN** entering edit mode on cell A1
- **THEN** input element appears positioned over A1

#### Scenario: IME composition handling

- **WHEN** using IME to input Chinese characters
- **THEN** composition events are handled without premature commit

#### Scenario: Enter commits value

- **WHEN** pressing Enter (not during IME composition)
- **THEN** input value is committed to cell and editor closes

#### Scenario: Escape cancels edit

- **WHEN** pressing Escape
- **THEN** edit is cancelled, original value preserved

### Requirement: AutoScroller enables drag-to-edge scrolling

The system SHALL automatically scroll when dragging near viewport edges, with speed proportional to distance from edge.

#### Scenario: Drag near right edge

- **WHEN** dragging within 50px of right edge
- **THEN** viewport scrolls right automatically

#### Scenario: Speed increases near edge

- **WHEN** dragging closer to edge
- **THEN** scroll speed increases (max 50px per frame)

#### Scenario: Stop scrolling when leaving edge zone

- **WHEN** dragging back to center
- **THEN** auto-scroll stops

### Requirement: ContextMenu provides right-click menu

The system SHALL display a context menu on right-click with built-in items (cut/copy/paste, insert/delete row/col, merge/unmerge, clear) and plugin extension support.

#### Scenario: Show menu on right-click

- **WHEN** right-clicking on a cell
- **THEN** context menu appears at click position

#### Scenario: Menu item triggers action

- **WHEN** clicking "Insert Row Above"
- **THEN** a new row is inserted above current selection

#### Scenario: Plugin extends menu

- **WHEN** a plugin registers custom menu items
- **THEN** those items appear in the context menu
