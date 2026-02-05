## ADDED Requirements

### Requirement: Plugin interface defines extension points

The system SHALL define a Plugin interface with manifest (name, version, dependencies), lifecycle hooks (onInstall, onUninstall, onWorkbookCreate), data hooks (onCellGet, onCellSet), command hooks (onBeforeCommand, onAfterCommand), render hooks (onCellRender), and interaction hooks (onCellClick, onKeyDown, etc.).

#### Scenario: Plugin with manifest

- **WHEN** defining a plugin
- **THEN** it MUST have a manifest with name and version

#### Scenario: Plugin lifecycle hooks

- **WHEN** installing a plugin
- **THEN** onInstall hook is called with PluginContext

#### Scenario: Data hooks can modify values

- **WHEN** onCellGet hook is defined
- **THEN** it can transform the returned cell data

### Requirement: PluginManager handles plugin lifecycle

The system SHALL provide a PluginManager that handles plugin installation, uninstallation, and dependency resolution.

#### Scenario: Install plugin

- **WHEN** calling `pluginManager.install(plugin)`
- **THEN** plugin is registered and onInstall is called

#### Scenario: Uninstall plugin

- **WHEN** calling `pluginManager.uninstall('plugin-name')`
- **THEN** plugin's onUninstall is called and plugin is removed

#### Scenario: Dependency check on install

- **WHEN** installing a plugin that depends on 'other-plugin'
- **THEN** installation fails if 'other-plugin' is not installed

#### Scenario: Prevent uninstall with dependents

- **WHEN** uninstalling a plugin that other plugins depend on
- **THEN** uninstallation fails with error

### Requirement: PluginContext provides access to core systems

The system SHALL provide a PluginContext that gives plugins access to: workbook, commands, events, layout, selection, and private state storage.

#### Scenario: Plugin accesses workbook

- **WHEN** plugin receives PluginContext
- **THEN** it can read/modify workbook through `ctx.workbook`

#### Scenario: Plugin executes commands

- **WHEN** plugin calls `ctx.commands.execute(...)`
- **THEN** the command is executed through normal command system

#### Scenario: Plugin subscribes to events

- **WHEN** plugin calls `ctx.events.on('cell:click', ...)`
- **THEN** plugin receives cell click events

#### Scenario: Plugin stores private state

- **WHEN** plugin calls `ctx.setState('key', value)`
- **THEN** value is stored in plugin-namespaced storage

### Requirement: Hook execution follows registration order

The system SHALL execute hooks in plugin registration order, allowing early plugins to modify data seen by later plugins.

#### Scenario: Multiple plugins hook same event

- **WHEN** plugin A (registered first) and plugin B both define onCellGet
- **THEN** A's hook executes first, B sees A's modifications

#### Scenario: Hook can stop propagation

- **WHEN** an interaction hook returns `true`
- **THEN** subsequent plugin hooks and default behavior are skipped

### Requirement: Hooks are synchronous

The system SHALL execute all hooks synchronously to ensure predictable execution order and avoid race conditions.

#### Scenario: Hooks complete before command proceeds

- **WHEN** onBeforeCommand hooks are called
- **THEN** command execution waits for all hooks to complete

#### Scenario: No async hooks supported

- **WHEN** a hook returns a Promise
- **THEN** the Promise is ignored, hook is treated as completed

### Requirement: Built-in plugins for core features

The system SHALL provide optional built-in plugins: Clipboard (copy/cut/paste), Formula (formula parsing and calculation), History (Ctrl+Z/Y shortcuts).

#### Scenario: Clipboard plugin handles copy

- **WHEN** Clipboard plugin is installed and user presses Ctrl+C
- **THEN** selected cells are copied to clipboard

#### Scenario: Formula plugin computes cell values

- **WHEN** Formula plugin is installed and cell has formula "=A1+B1"
- **THEN** onCellGet returns computed sum instead of formula text

#### Scenario: History plugin adds shortcuts

- **WHEN** History plugin is installed
- **THEN** Ctrl+Z triggers undo, Ctrl+Y triggers redo
