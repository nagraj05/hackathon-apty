# APTY Hackathon

This Chrome extension is built using **React**, **Vite**, **Tailwind CSS**, and **ShadCN**. It provides multiple productivity-enhancing features, including time tracking, smart notes, tab grouping, and an ad blocker.

## Features

### 🚀 Productivity Tracker
- Tracks the time you spend on each website.
- Displays time spent per domain.
- Allows users to reset tracking data.

### 📝 Smart Notes
- Save, update, and delete notes.
- **Local Notes:** Notes are tied to a specific URL.
- **Global Notes:** Accessible from any page in the browser.

### 📂 Tab Grouping
- Save and restore grouped tabs.
- Create named tab groups for different workflows.
- Restore saved groups with a single click.

### 🚫 Ad Blocker
- Blocks intrusive ads across websites.
- Improves browsing experience and speeds up page load times.

## Installation

1. Clone the repository:
   ```sh
   https://github.com/nagraj05/hackathon-apty.git
   cd hackathon-apty
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Build the extension:
   ```sh
   npm run build
   ```

4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable **Developer mode** (top right corner)
   - Click **Load unpacked** and select the `dist` folder

## Development

- Run the extension in development mode:
  ```sh
  npm run dev
  ```
- Hot reload is enabled using Vite.

## Technologies Used
- **React**: UI development
- **Vite**: Fast build tool
- **Tailwind CSS**: Styling
- **ShadCN**: UI components
- **Chrome Extension API**: Functionality implementation

## Contribution
Feel free to fork this project and add new features! Pull requests are welcome.

