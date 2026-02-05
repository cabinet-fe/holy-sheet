## ADDED Requirements

### Requirement: Command interface defines executable operations

The system SHALL define commands with type, payload, and optional undo data. All data modifications MUST go through the command system.

#### Scenario: Execute SET_CELL command

- **WHEN** executing `{ type: 'SET_CELL', payload: { row: 0, col: 0, data: { v: 'Hello' } } }`
- **THEN** cell A1 value is set to 'Hello' and undo data is generated

#### Scenario: Command returns result

- **WHEN** executing any command
- **THEN** a CommandResult with success status and optional undo data is returned

### Requirement: CommandDispatcher routes and executes commands

The system SHALL provide a CommandDispatcher that routes commands to registered handlers and manages hooks.

#### Scenario: Register command handler

- **WHEN** calling `dispatcher.register('CUSTOM_CMD', handler)`
- **THEN** handler is invoked when CUSTOM_CMD is executed

#### Scenario: Before hook can cancel command

- **WHEN** a before hook returns `false`
- **THEN** command execution is cancelled

#### Scenario: After hook receives result

- **WHEN** command execution completes
- **THEN** after hooks receive the command and result

### Requirement: UndoStack maintains operation history

The system SHALL maintain undo and redo stacks with configurable size limit (default 100), supporting grouped undo operations.

#### Scenario: Undo reverts last operation

- **WHEN** calling `dispatcher.undo()` after setting a cell value
- **THEN** the cell returns to its previous value

#### Scenario: Redo restores undone operation

- **WHEN** calling `dispatcher.redo()` after undo
- **THEN** the change is re-applied

#### Scenario: Stack size limit

- **WHEN** more than 100 operations are performed
- **THEN** oldest undo entries are discarded

#### Scenario: Grouped undo

- **WHEN** multiple commands are executed in a transaction
- **THEN** they undo/redo as a single unit

### Requirement: Transaction groups multiple commands

The system SHALL support transactions where multiple commands are grouped and can be committed or rolled back atomically.

#### Scenario: Begin and commit transaction

- **WHEN** `beginTransaction()`, execute commands, `commit()`
- **THEN** all commands are applied and form one undo group

#### Scenario: Rollback transaction

- **WHEN** `beginTransaction()`, execute commands, `rollback()`
- **THEN** all changes are reverted, nothing added to undo stack

#### Scenario: Nested transaction not supported

- **WHEN** calling `beginTransaction()` while already in transaction
- **THEN** an error is thrown

### Requirement: Command merging for continuous edits

The system SHALL merge consecutive commands of the same type on the same cell within a 300ms window into a single undo unit.

#### Scenario: Continuous typing merges

- **WHEN** typing 'H', 'e', 'l', 'l', 'o' quickly in same cell
- **THEN** only one undo entry is created for entire word

#### Scenario: Different cells don't merge

- **WHEN** typing in A1, then B1, then A1 again
- **THEN** each cell edit is a separate undo entry

#### Scenario: Break merge manually

- **WHEN** calling `dispatcher.breakMerge()`
- **THEN** next command starts a new undo group regardless of timing

### Requirement: Built-in commands for common operations

The system SHALL provide built-in commands: SET_CELL, SET_CELLS, CLEAR_CELLS, INSERT_ROWS, DELETE_ROWS, INSERT_COLS, DELETE_COLS, SET_ROW_HEIGHT, SET_COL_WIDTH, HIDE_ROWS, SHOW_ROWS, HIDE_COLS, SHOW_COLS, MERGE_CELLS, UNMERGE_CELLS, SET_STYLE, ADD_SHEET, DELETE_SHEET, RENAME_SHEET, MOVE_SHEET.

#### Scenario: INSERT_ROWS command

- **WHEN** executing `{ type: 'INSERT_ROWS', payload: { at: 5, count: 3 } }`
- **THEN** 3 new rows are inserted at position 5

#### Scenario: MERGE_CELLS command

- **WHEN** executing `{ type: 'MERGE_CELLS', payload: { sr: 0, sc: 0, er: 2, ec: 2 } }`
- **THEN** cells A1:C3 are merged into one

#### Scenario: DELETE_COLS updates references

- **WHEN** deleting column B
- **THEN** data shifts left and any formulas referencing columns after B are updated

#### Scenario: SET_STYLE applies style

- **WHEN** executing SET_STYLE with selection and style
- **THEN** all cells in selection receive the style (via StylePool)
