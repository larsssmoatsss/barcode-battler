# Barcode Battler

**Scan barcodes. Catch monsters. Battle.**

[Play the Live Demo](https://barcode-battler-lm.vercel.app)

---

## What is this?

Barcode Battler is a browser-based monster collection game with a Game Boy aesthetic. Point your camera at any real-world barcode - a cereal box, a soda can, a library book - and discover what creature lurks within. Build your team, battle wild monsters, and try to catch all 126.

If you grew up scanning barcodes with Skannerz in the early 2000s or spent countless hours catching Pokemon on a dusty Game Boy, this one's for you.

---

## How It Works

Every barcode maps to either a monster or an item through a deterministic algorithm. The same barcode will always give you the same result, so that box of Cheerios in your pantry? That's YOUR monster now. Go find more.

**Monsters** come in three types forming a rock-paper-scissors triangle:
- Arcane beats Primal
- Primal beats Divine  
- Divine beats Arcane

**Battles** are 3v3 turn-based fights against randomly generated wild teams. Type advantage matters. Winning earns EXP. Leveling up makes your monsters stronger. You know the drill.

**Items** can be found while scanning and used in battle to heal or gain an edge.

---

## Tech Stack

- **React 18** - UI and state management
- **Vite** - Build tooling and dev server
- **html5-qrcode** - Barcode scanning via device camera
- **Local Storage** - Persistent save data (your collection lives in your browser)
- **Vercel** - Hosting and deployment

No backend. No accounts. No tracking. Just you and your barcodes.

---

## Running Locally

```bash
git clone https://github.com/larsssmoatsss/barcode-battler.git
cd barcode-battler
npm install
npm run dev
```

Open `http://localhost:5173` and start scanning.

---

## Features

- 126 unique monsters across three types
- Deterministic barcode-to-monster mapping
- Turn-based battle system with type advantages
- EXP and leveling system
- Item collection and usage
- Persistent save data via localStorage
- Authentic 4-color Game Boy palette
- Mobile-friendly with camera access
- Battle animations and scrolling text log

---

## Inspiration

This project is a love letter to two things:

**Skannerz** (2000) - Radica's handheld toy that let you scan barcodes to collect monsters. It was ahead of its time and absolutely ruled.

**Pokemon Red/Blue** (1996) - The Game Boy classic that defined monster collection games. The battle UI, the aesthetic, the "gotta catch 'em all" energy - it's all here.

---

## Author

Built by Lars, 2025.

---

*Now go scan something.*