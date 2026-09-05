# Rebalance Advisor Design System

## 0. Research Log
- Embedded refs: user screenshots of Google Sheets portfolio workflow -> picked `taste-skill` + `layout-skill` because this is an operational finance dashboard with dense tables, editable inputs, and fixed summaries.
- Lazyweb: skipped because the user's spreadsheet screenshots provide the product reference and workflow.
- Imagen drafts: skipped because the request is to convert an existing spreadsheet workflow into an application, not create a marketing-style visual concept.
- Skipped lanes: react dev tooling bootstrap deferred until package scaffold exists.

## 1. Atmosphere & Identity
Rebalance Advisor feels like a quiet investment workbench: spreadsheet precision, clearer hierarchy, and fewer places to make a manual calculation mistake. The signature is an orange rule-and-header system carried from the original sheet, balanced by calm neutral surfaces and explicit pink/blue trading guidance.

## 2. Color

### Palette

| Role | Token | Light | Usage |
|------|-------|-------|-------|
| Surface/app | --surface-app | #F6F4EF | Page background |
| Surface/panel | --surface-panel | #FFFFFF | Primary panels |
| Surface/subtle | --surface-subtle | #ECEAE4 | Inputs, grouped rows |
| Surface/warm | --surface-warm | #FFF3DF | Active account and hints |
| Text/primary | --text-primary | #242424 | Headings and key values |
| Text/secondary | --text-secondary | #66645E | Labels and helper text |
| Text-muted | --text-muted | #9A978F | De-emphasized values |
| Border/default | --border-default | #D9D5CB | Panel and table dividers |
| Border/strong | --border-strong | #BDB7AA | High-density table borders |
| Accent/orange | --accent-orange | #FF9416 | Section bars, selected state |
| Accent/orange-dark | --accent-orange-dark | #B95E00 | Hover and strong text |
| Signal/buy | --signal-buy | #F85EAA | Buy guidance and gains |
| Signal/sell | --signal-sell | #2296C7 | Sell guidance and losses |
| Signal/good | --signal-good | #29835A | Balanced status |
| Signal/warn | --signal-warn | #A05D00 | Drift warnings |
| Focus/ring | --focus-ring | #1E6BFF | Keyboard focus |

### Rules
- Orange appears only on table headers, selected navigation, and account separators.
- Pink and blue are reserved for trading intent and return polarity.
- Cash uses neutral text unless it creates portfolio drift.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | 32px | 750 | 1.15 | 0 | Dashboard title and total asset value |
| H1 | 26px | 700 | 1.2 | 0 | Page title |
| H2 | 20px | 700 | 1.3 | 0 | Panel title |
| H3 | 16px | 700 | 1.4 | 0 | Table section title |
| Body | 15px | 500 | 1.55 | 0 | Default interface text |
| Body/sm | 13px | 500 | 1.45 | 0 | Dense table cells |
| Caption | 12px | 650 | 1.35 | 0 | Labels, badges, metadata |
| Numeric | 14px | 650 | 1.35 | 0 | Financial values |

### Font Stack
- Primary: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif
- Mono: "SFMono-Regular", "Cascadia Code", "Menlo", monospace

### Rules
- Korean text may wrap naturally; table identifiers and tickers use `overflow-wrap: anywhere`.
- Numbers use tabular figures.
- No text below 12px.

## 4. Spacing & Layout

### Base Unit
All spacing derives from 4px.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight numeric groups |
| --space-2 | 8px | Inline controls |
| --space-3 | 12px | Table cell padding |
| --space-4 | 16px | Compact panel padding |
| --space-5 | 20px | Panel header spacing |
| --space-6 | 24px | Main gutters |
| --space-8 | 32px | Section separation |
| --space-10 | 40px | Page rhythm |

### Grid
- Max content width: 1680px.
- App shell: fixed left navigation at wide widths, scrolling main content.
- Product grid: two-column analysis area above a full-width table; the allocation and target panels use a visible width slider so users can adapt the split to their display, and collapse to one column on compact mobile widths.
- Breakpoints: compact 640px, wide 1024px, full 1280px.

### Rules
- Main content owns vertical scroll.
- Tables may scroll horizontally inside their own region; the page itself must not horizontally overflow.
- Repeated account groups use orange separators, not floating section cards.

## 5. Components

### App Shell
- **Structure**: sidebar navigation, top summary rail, scrollable main.
- **Variants**: desktop fixed sidebar, desktop collapsed icon rail, mobile top navigation.
- **Spacing**: --space-4 to --space-6.
- **States**: active, hover, focus, collapsed.
- **Accessibility**: `nav`, `main`, visible focus, icon-only collapsed buttons keep explicit accessible names.
- **Motion**: 120ms button feedback only; sidebar width state changes immediately.
- **Layout**: fixed-sidenav-shell; main is the scroll owner, and the collapsed sidebar preserves account navigation while giving more horizontal room to portfolio panels.

### Metric Tile
- **Structure**: label, numeric value, optional trend.
- **Variants**: neutral, gain, loss, warning.
- **Spacing**: --space-3 and --space-4.
- **States**: static.
- **Accessibility**: trend is text, not color-only.
- **Motion**: none.
- **Layout**: intrinsic grid.

### Allocation Donut
- **Structure**: asset allocation donut, allocation legend, and a risk distribution bar beneath the donut area.
- **Variants**: asset-class summary, risk summary, empty risk summary.
- **Spacing**: --space-3 to --space-6.
- **States**: static, no-holding empty state.
- **Accessibility**: the risk distribution has a labeled region and text legend so risk is not color-only.
- **Motion**: none.
- **Layout**: risk distribution sits below the portfolio pie chart and uses the same bounded panel width.

### Dense Data Table
- **Structure**: caption, sticky header, grouped body, numeric alignment.
- **Variants**: strategy targets, holdings, asset classes, sortable weight and valuation columns.
- **Spacing**: --space-2 and --space-3.
- **States**: editable, read-only, row focus, empty, sorted ascending, sorted descending.
- **Accessibility**: semantic table, `scope`, labeled inputs.
- **Motion**: focus ring only.
- **Layout**: horizontal reel inside bounded panel.

### Target Allocation Manager
- **Structure**: strategy table with an explicit add command; account-bound modal editor, searchable instrument-code and instrument-name dropdowns, read-only asset class, instrument risk badge, suitability select, percent input with `%` suffix, running account total, target table actions.
- **Variants**: all-portfolio read/edit view, account-specific add modal, edit modal, duplicate symbol blocked state, unregistered symbol blocked state.
- **Spacing**: --space-3 and --space-5.
- **States**: default, focus, disabled, read-only, editing, validation feedback.
- **Accessibility**: visible Korean labels for 계좌, 자산군, 위험도, 종목코드, 종목명, 적합성, 목표비율; risk is displayed as text, not color alone, and running total uses live text.
- **Motion**: 120ms control feedback only.
- **Layout**: the strategy panel is primarily a table; editing appears only in a centered modal so occasional edits do not consume the everyday dashboard view. On compact viewports, target allocation dialogs use a two-column form so the save action remains visible even when the target table is empty.

### Resizable Analysis Grid
- **Structure**: compact width control above the allocation and target panels; two bounded panels sharing one row.
- **Variants**: desktop adjustable split, compact stacked layout.
- **Spacing**: --space-3 above the grid and --space-6 between panels.
- **States**: range focus, hover, active drag.
- **Accessibility**: range input has an explicit Korean label for the allocation panel width.
- **Motion**: native range control only.
- **Layout**: target allocation receives the larger default width while the allocation panel remains readable; tables keep their own horizontal scroll.

### Editable Field
- **Structure**: visible label or table header, input/select, helper/error slot where needed.
- **Variants**: text, number, percent, select.
- **Spacing**: --space-2.
- **States**: default, hover, focus, disabled, invalid.
- **Accessibility**: no placeholder-as-label; label text remains available.
- **Motion**: 120ms border/background.
- **Layout**: cluster for inline controls.

### Rebalance Action
- **Structure**: ticker, amount, share count, action verb, account suitability.
- **Variants**: buy, sell, hold.
- **Spacing**: --space-3.
- **States**: hover, focus.
- **Accessibility**: action text includes buy/sell, not color alone.
- **Motion**: 120ms press feedback.
- **Layout**: cluster with wrapping.

### Holding Manager
- **Structure**: current holdings table with price refresh, FX refresh, add/edit/delete commands, cash-position editor, analysis-opinion column; account-bound modal editor, target-allocation-backed symbol and name search, read-only KRW/USD currency, current price, quantity, and average price inputs.
- **Variants**: all-portfolio read/edit view, account-specific add modal, edit modal, KRW/USD cash inputs, refreshing prices, refreshing FX rates, duplicate holding blocked state, target-missing blocked state.
- **Spacing**: --space-3 and --space-5.
- **States**: default, focus, disabled, editing, validation feedback.
- **Accessibility**: account, KRW cash, USD cash, symbol, name, currency, current price, quantity, average price, and analysis opinion use visible Korean labels; buy/sell/hold guidance remains text-based.
- **Motion**: 120ms control feedback only.
- **Layout**: adding holdings is account-specific; all-portfolio view can edit existing rows and account cash balances but adds new rows only after the user chooses an account view; current price and FX refresh actions are panel-scoped and keep status text below the panel heading.

### Market Detail Dialog
- **Structure**: centered modal opened from a clickable instrument name, period segmented control, price chart, risk/weight/return metric strip, analysis notes, and Naver/Google news search actions.
- **Variants**: loading chart, loaded chart, failed chart/news, holding-backed metrics, target-only metrics.
- **Spacing**: --space-3 to --space-6.
- **States**: default, hover, active, focus, selected period, close.
- **Accessibility**: dialog has modal semantics, close button has an accessible name, chart has a text label, news links are real anchors.
- **Motion**: 120ms control feedback; modal remains stable during async data loading.
- **Layout**: bounded scroll dialog with the chart and analysis visible above the news area; at compact widths the metric strip collapses into intrinsic columns.

### Account Manager
- **Structure**: separate metadata screen header, account rows, add command, icon-only edit/delete commands, modal account editor.
- **Variants**: add dialog, edit dialog, empty account.
- **Spacing**: --space-3 and --space-4.
- **States**: default, hover, active, focus, disabled, editing.
- **Accessibility**: every input has a visible label in the dialog; icon-only edit/delete buttons use explicit accessible names.
- **Motion**: 120ms press feedback.
- **Layout**: standalone metadata view; table-like account list with occasional editing handled in a centered modal. It is never embedded in the portfolio analysis/dashboard panel.

### Instrument Manager
- **Structure**: separate metadata screen header, instrument rows, add command, country/currency/category/risk badges, icon-only edit/delete commands, modal instrument editor.
- **Variants**: add dialog, edit dialog, duplicate-code blocked state, risk loading state, unavailable market-history state.
- **Spacing**: --space-3 and --space-4.
- **States**: default, hover, active, focus, disabled, editing, validation feedback.
- **Accessibility**: 종목명, 종목코드, 거래통화, 국가, 종류 all use visible labels in the dialog; risk is displayed as text, not color alone; icon-only edit/delete buttons use explicit accessible names.
- **Motion**: 120ms press feedback.
- **Layout**: standalone metadata view alongside account metadata; frequent scanning stays in the list and occasional editing opens in a centered viewport-level modal that is independent of the metadata list scroll length.

### Data Manager
- **Structure**: separate metadata screen with export, import, and reset actions plus a live status line.
- **Variants**: export completed to selected path, export fallback to browser downloads, export canceled, import completed, import failed, reset confirmed.
- **Spacing**: --space-3 to --space-5.
- **States**: default, hover, active, focus, hidden file input.
- **Accessibility**: import uses a labeled file input behind a visible button; reset asks for browser confirmation before replacing data.
- **Motion**: 120ms button feedback only.
- **Layout**: standalone metadata panel; actions use an intrinsic grid and never appear inside the portfolio dashboard panels.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 120ms | ease-out | Button, row, field feedback |
| Standard | 220ms | ease-in-out | Tab or account selection |
| Emphasis | 360ms | cubic-bezier(0.16, 1, 0.3, 1) | Initial panel entrance |

### Rules
- Animate only transform and opacity.
- Respect `prefers-reduced-motion`.
- Every button and input has hover, active, and focus treatment.

## 7. Depth & Surface

### Strategy
Mixed: panels use subtle shadows plus crisp borders; dense tables use borders and tonal row fills.

| Level | Value | Usage |
|-------|-------|-------|
| Subtle | 0 1px 2px rgba(89, 74, 45, 0.06) | Toolbar and metric tiles |
| Default | 0 12px 32px rgba(89, 74, 45, 0.10) | Major panels |

## 8. Accessibility Constraints & Accepted Debt

### Constraints
- WCAG 2.2 AA target: 4.5:1 body contrast, 3:1 large text and non-text indicators.
- Full keyboard reachability for navigation, table fields, and actions.
- Korean labels must not clip at compact widths.
- Buy/sell state must be represented by visible words as well as color.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| Live market prices are seeded sample data | App data model | External brokerage/market API integration requires user-selected providers and credentials | Replace sample price adapter with authenticated provider integration |
