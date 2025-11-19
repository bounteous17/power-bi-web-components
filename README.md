# Profit Dashboard - Power BI Custom Visual

A custom Power BI visual that displays a line chart with monthly data points.

## Features

- **Line Chart**: Displays monthly values with smooth curves and filled area
- **Interactive Data Points**: Visual indicators with value labels
- **Grid Lines**: Horizontal and vertical reference lines
- **Responsive Design**: Adapts to different container sizes

## Prerequisites

### Node.js (via nvm)

Install nvm (Node Version Manager):

```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Windows - use nvm-windows: https://github.com/coreybutler/nvm-windows
```

Then install and use the project's Node version:

```bash
nvm install
nvm use
```

This will use the version specified in `.nvmrc` (v24.11.1).

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Package

```bash
npm run package
```

This creates: `dist/profitDashboard9A8B7C6D5E4F.1.0.0.0.pbiviz`

## Import to Power BI

### Power BI Desktop

1. Open Power BI Desktop
2. Click "..." in Visualizations pane
3. Select "Import a visual from a file"
4. Browse to the `.pbiviz` file
5. Click OK

### Power BI Service (Web)

1. Go to [powerbi.com](https://powerbi.com)
2. Open your Workspace
3. Click Settings (gear icon) → Manage workspace
4. Go to "Custom visuals" tab
5. Click "Add a custom visual" → "Add from file"
6. Upload the `.pbiviz` file
7. The visual will be available in all reports within that workspace

## Add Data

Drag fields to:
- **Category** - Month names or date categories
- **Values** - Numeric values for the chart

## Data Structure Example

| Month | Value |
|-------|-------|
| JAN   | 38    |
| FEB   | 42    |
| MAR   | 44    |
| APR   | 53    |
| MAY   | 48    |
| JUN   | 14    |
| JUL   | 16    |
| AUG   | 10    |
| SEP   | 19    |
| OCT   | 17    |
| NOV   | 16    |
| DEC   | 17    |

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run package` | Build the `.pbiviz` package for distribution |
| `npm run start` | Start development server with hot reload |
| `npm run preview` | Generate standalone HTML preview |

## Project Structure

```
power-bi-web-components/
├── capabilities.json      # Data binding configuration
├── pbiviz.json           # Visual metadata
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .nvmrc                # Node version
├── src/
│   └── visual.ts         # Main visual logic
├── style/
│   └── visual.less       # Styling
├── assets/
│   └── icon.png          # Visual icon
└── dist/                 # Compiled output
    └── *.pbiviz          # Package file
```

## Troubleshooting

### Build Errors

```bash
rm -rf .tmp dist node_modules
npm install
npm run package
```
