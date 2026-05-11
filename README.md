Digital Sovereignty Score (SDS) Calculator
=========================================

A small, static HTML/CSS/JS application that calculates the Digital Sovereignty Score (SDS) based on a short checklist.

- Simple yes/no selection per question
- Live SDS calculation; special rule: if question 0 is answered "No", the score is immediately 5
- No dependencies or build steps (purely static)

Project Structure

- `index.html` – Markup for the checklist and result area
- `index.css` – Layout and styling in a monochrome blue infographic style
- `index.js` – Interaction (selection, keyboard access, calculation, lines/arrows)

Run Locally

Two straightforward ways to run the project locally:

1. Open in the browser directly
   - Double-click `index.html` or open it via your browser's "File > Open" dialog.

2. Serve via a small local web server (recommended for consistent behavior)
   - Using Python 3:
     - Navigate to the project directory
     - Run: `python -m http.server 8000` (on Windows you can use `py -m http.server 8000`)
     - Open `http://localhost:8000/` in your browser and navigate to `index.html`
   - Using Node.js:
     - Run: `npx http-server -p 8000`
     - Open `http://localhost:8000/` in your browser
   - Alternatively: use the VS Code "Live Server" extension and open `index.html`

Development

- No toolchain required. Edit `index.html`, `index.css`, or `index.js` directly.
- The code runs without a bundler.

License

See `LICENSE` in this repository.
