# Holy Sheet

A high-performance, lightweight Canvas spreadsheet library for the web.

## Features

- **High Performance**: Renders 1 million cells with 60fps scrolling
- **Lightweight**: Core package < 60KB (gzipped)
- **Framework Agnostic**: Works with React, Vue, Svelte, or vanilla JS
- **Excel Compatible**: Supports standard Excel data model and formulas (via plugin)
- **Extensible**: Powerful plugin system for custom functionality

## Installation

```bash
npm install @holy-sheet/core
```

## Usage

```typescript
import { HolySheet } from '@holy-sheet/core'
import '@holy-sheet/core/dist/style.css' // If any styles needed

const sheet = new HolySheet({
  container: document.getElementById('app'),
  rowCount: 1000,
  colCount: 100
})

// Set data
sheet.setData(0, 0, { v: 'Hello World' })

// Get data
const cell = sheet.getData(0, 0)
console.log(cell.v)
```

## Architecture

- **Data Model**: Sparse matrix storage for efficient memory usage
- **Render Engine**: Layered Canvas rendering with dirty rect optimization
- **Command System**: Full undo/redo support with transaction management
- **Plugin System**: Hook-based extension points for all core systems

## License

MIT
