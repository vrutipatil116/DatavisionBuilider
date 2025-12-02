A PowerBI-style Data Visualization & Dashboard Builder built with React
🚀 Overview

DataVision Builder is an advanced browser-based data visualization tool.
It supports Excel/CSV upload, real-time data cleaning, slicers, multi-visual dashboards, PPT export, template saving, and a complete PowerBI-like filtering system — all in one platform.

The project is built using React, Vite, Chart.js, Valtio, ExcelJS, SheetJS, and Day.js.

✨ Features
🔹 1. Upload & Clean Excel/CSV

Accurate raw import using SheetJS

No timezone issues

No “–1 day” date shift

Auto type detection

Data cleaning & transformation support

🔹 2. Dynamic Visuals

Bar, Line, Pie, Donut, Area charts

KPI Cards

Customizable data labels, colors & fonts

Axis and legend formatting

Drag, resize, and reposition visuals

🔹 3. PowerBI-Style Slicers

Text Slicer

Numeric Slicer

Date Slicer

Range Slicer (with correct min/max detection)

Real-time filtering across visuals

🔹 4. Dashboard Builder

Multi-slide dashboard layout

Auto-layout engine to prevent overlapping

Persistent formatting (no reset after data refresh)

Visual size preserved across page navigation

Template saving (layout + visuals)

Template history with timestamps

🔹 5. Export Tools

Multi-slide PPTX export with accurate UI spacing

Clean structured Excel export

Export of cleaned dataset

🔹 6. Formatting Panel

Visual colors

Typography controls

Card label customization

Axis & gridline styling

Tooltip customization

Data label formatting

Transparency controls

🖥 How to Run
npm install
npm run dev

🧪 Challenges Solved

✔ Removed Excel timezone issues
✔ Fixed the “–1 Day” date bug
✔ Corrected Range Slicer min/max mismatch
✔ Fixed visual overlapping & auto-shifting
✔ Prevented formatting reset after dataset refresh
✔ Resolved PPTX layout breaks
✔ Fixed visual size reset on page change

🔮 Future Improvements

PDF Export

Undo/Redo System

Cloud Save Functionality

Theme Customization

👤 Author

Vrutik Patil
React Developer | Data Visualization | BI Tool Builder