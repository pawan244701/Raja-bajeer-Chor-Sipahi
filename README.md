# Raja-Mantri-Chor-Sipahi Game

An interactive modern web implementation of the classic Indian bluffing card game **Raja-Mantri-Chor-Sipahi** (King-Minister-Thief-Police), built with **React** and styled using **Tailwind CSS**.

---

## 🎮 About the Game

Raja-Mantri-Chor-Sipahi is a traditional four-player guessing game:
- **Raja (King):** 1000 points
- **Bajeer / Mantri (Minister):** 800 points
- **Sipahi (Police):** 500 points
- **Chor (Thief):** 0 points

### 🎯 Rules & Flow
1. **Setup:** 4 players enter their names and select the total number of rounds to play.
2. **Card Assignment:** In each round, roles are shuffled and assigned secretly to players.
3. **Role Reveal:** The **Raja** and **Bajeer** (Minister) cards are revealed automatically.
4. **The Guessing Phase:** The player holding the **Bajeer** card must identify who holds the **Chor** card among the remaining hidden players.
5. **Scoring:**
   - If **Bajeer** guesses correctly, Bajeer gets 800 points and the Chor gets 0.
   - If **Bajeer** guesses wrong, Bajeer loses their points (gets 0) and the **Chor** gets the 800 points.
6. **Tie-Breaker:** If a draw happens at the end of the total rounds, all users will have to play another chance (an extra round) to clear the draw.
7. **Winner:** The player with the highest total score at the end of all rounds wins!

---

## 🛠️ Tech Stack

- **Frontend:** React.js
- **Styling:** Tailwind CSS
- **Icons / UI:** Custom CSS & Tailwind utilities

---

## 🚀 Getting Started

Follow these steps to clone, setup, and run the project on your local machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16.x or higher recommended)
- `npm`

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/pawan244701/Raja-bajeer-Chor-Sipahi.git
   # Navigate into the project folder
   cd Raja-bajeer-Chor-Sipahi

   # Install dependencies
   npm install

   # Start the development server
   npm run dev


   
