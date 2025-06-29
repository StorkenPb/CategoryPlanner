# 🛠 E-Commerce Category Structure Tool – Development Plan

# 🧭 Overview

This tool will help e-commerce sellers (new or existing) plan, build, and visualize category trees for their stores. It will support drag-and-drop editing, text/table editing, hierarchical exports supporting some PIM systems.

---

# ✅ Goals

- Create and visualize category hierarchies
- Enable drag-and-drop reordering
- Allow import/export of tree structures
- Export in PIM-compatible formats (CSV, JSON, XML)
- Optional: save/load structures, templates

---

# 📦 Project Phases & TODOs

### 🔹 Phase 1: Planning & Requirements

- [x] Define use case and user needs
- [o] Decide tech stack
- [ ] Specify export formats needed for target PIMs
- [ ] Research visualization libraries

### 🔹 Phase 2: UI/UX Design

- [ ] Sketch out core UI layout:
  - Sidebar: Tree actions (add, delete, rename)
  - Main panel: Tree visualization
  - Details panel: Metadata editor
  - Toolbar: Import/export buttons
- [ ] Build low-fidelity wireframes (e.g., in Figma)
- [ ] Design UX for drag-and-drop editing

### 🔹 Phase 3: Setup and Scaffolding

- [ ] Create project folder structure
- [ ] Set up Next.js or React project
- [ ] Install visualization library (e.g., `react-flow`)
- [ ] Add Tailwind CSS or component system (e.g., `shadcn/ui`)
- [ ] Add placeholder category data
- [ ] Implement tree state (e.g., Zustand)

### 🔹 Phase 4: Core Feature Implementation

- [ ] Tree view component (with visualization)
- [ ] Add/remove category nodes
- [ ] Rename/edit nodes
- [ ] Drag-and-drop to reorder/move nodes
- [ ] Select node → show detail view (name, metadata)

### 🔹 Phase 5: Import/Export System

- [ ] Export to:
  - [ ] JSON (full hierarchy)
  - [ ] CSV (flattened tree with parent references)
  - [ ] XML (optional; for specific PIMs)
- [ ] Import from:
  - [ ] JSON (own format)
  - [ ] CSV (from existing sources)

### 🔹 Phase 6: Advanced Features (Optional)

- [ ] Search/filter within the tree
- [ ] Templates for common structures (Electronics, Apparel, etc.)
- [ ] Versioning support
- [ ] User login and saved category trees
- [ ] Collaborative editing or sharing

### 🔹 Phase 7: Deployment

- [ ] Deploy front-end via Vercel or Netlify
- [ ] Configure backend (optional, if persistent storage is needed)
- [ ] Add basic analytics or error reporting (Sentry, etc.)

---

# 💡 Tech Stack Summary

| Part         | Choice                |
|--------------|-----------------------|
| Framework    | React / Next.js       |
| UI           | Tailwind + shadcn/ui  |
| State Mgmt   | Zustand               |
| Tree Viz     | `react-flow`          |
| Export Tools | `json2csv`            |
| Deployment   | Vercel or Netlify     |

---

# 📁 Suggested Project Structure (Cursor-Friendly)

## Feature List

### 🚀 MVP

- [x] Represent category hierarchy as an internal object
- [x] Visualize category hierarchy as a tree
- [x] Rename/edit category nodes
- [x] Add new category nodes using visual components and keyboard
- [ ] Remove category nodes
- [ ] Select node to view/edit details (name, metadata)
- [x] Export category tree to CSV (using json2csv)
- [x] Import category tree from CSV

### 🔮 Future features

- [ ] Visualize category hierarchy as an editable text (list)
- [ ] Add new category nodes using text/list interaction
- [ ] Light/Dark mode
- [ ] Drag-and-drop to reorder/move nodes

### 🙅 Wont do
- [ ] Mobile friendly version

## User stories
- As a user I want to see the nodes of an hard coded category as visual nodes on a web page
- As a user I want to edit any nodes name by pressing the node and enter text
- As a user I want to add a sibling to an existing node by selecting it and pressing TAB
- As a user I want to add a child to an existing node by selecting it and pressing ENTER
- As a user I want to add a sibling to an existing node by selecting it and clicking an icon
- As a user I want to add a child to an existing node by selecting it and clicking an icon
- As a user I want to remove a node by selecint it and pressing DEL


# Data modeling

A category have the following data
- code
- labels []
- parent?

a code is a string (often the english version using lowercase and underscode (_) as the delimiter)

the list of labels, needs at least one, are the visual name of the category for a given language

The parent is optional but connects any node to another parent node using the code as the referrence.

## CSV Export


Example

code;label-en_US;label-sv_SE;parent
electronics;Electronics;Elektronik;
phones;Phones;Telefoner;electronics