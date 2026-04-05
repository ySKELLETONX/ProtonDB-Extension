# ProtonDB Extension for Millennium

![Millennium Version](https://img.shields.io/badge/Millennium-v1.0.0-blueviolet?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Windows-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![ProtonDB](https://img.shields.io/badge/Data%20Source-ProtonDB-red?style=for-the-badge)

A lightweight and efficient plugin for the **Millennium Steam client** that integrates **ProtonDB** compatibility ratings directly into the Steam Store pages. 

Stop switching between your browser and Steam; check if a game runs on Linux/Steam Deck instantly.

---

## 🚀 Features

* **Store Page Ratings:** Displays the ProtonDB tier (Platinum, Gold, Silver, Bronze, Borked) in the store page sidebar alongside developer and publisher info.
* **Library Page Badges:** Shows a colour-coded ProtonDB badge in the game detail banner when browsing your library.
* **Colour Coded:** Tier text matches ProtonDB’s official tier colours for instant recognition.
* **One-Click Access:** Click any rating to open the full ProtonDB report page for detailed tweaks and user comments.
* **Cached Results:** Ratings are cached per session to minimise API calls.

---

## 🛠️ Installation

### Prerequisites
* **Millennium** must be installed on your Steam client. If you don't have it, get it at [steambrew.app](https://steambrew.app/).

### Steps

1.  **Navigate to your Millennium plugins folder:**
    * **Linux:** `~/.local/share/millennium/plugins/`
    * **Windows:** `C:\Program Files (x86)\Steam\millennium\plugins\`

2.  **Clone the repository:**
    ```bash
    cd ~/.local/share/millennium/plugins/
    git clone https://github.com/ySKELLETONX/ProtonDB-extension.git
    ```

3.  **Restart Steam:**
    Completely close Steam and restart it. The plugin will be loaded automatically by the Millennium framework.

---

## 📖 How to Use

Once installed, simply browse the **Steam Store**:
1.  Open any game page (e.g., *Cyberpunk 2077*).
2.  Wait a split second for the data to fetch.
3.  A dynamic badge will appear near the game title showing the **ProtonDB Tier**.
4.  **Click** the badge to see more details on the official site.

---

## ⚙️ Configuration

If you want to customize the appearance, you can modify the `main.lua` file:
* **Positioning:** Change the `millennium.ui.insert_before` selector to move the badge to a different part of the UI.
* **Styling:** Edit the CSS strings inside the Lua script to match your personal Steam skin.

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for better UI integration or extra features:
1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📜 Credits

* **Data provided by:** [ProtonDB](https://www.protondb.com/)
* **Framework:** [Millennium](https://docs.steambrew.app/)