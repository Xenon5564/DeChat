# DeChat

DeChat is a **decentralized chat application** built to prioritize user privacy, data integrity, and local control. Unlike centralized platforms, DeChat allows users to own their identity via cryptographic key pairs and communicate securely.

## Core Features
*   **Decentralized Identity:** Users generate unique key pairs stored locally. You own your own identity. No central database for account creation.
*   **Cryptographically Verified:** All messages are digitally signed. The server verifies signatures to ensure no tampering occurs.
*   **Media Support:** Send text, images, and videos.
*   **Multi-Channel Architecture:** Dynamic server-side configuration via `channels.json`.
*   **Modern UI:** A clean, responsive dashboard built with React.

## Tech Stack
*   **Frontend:** React, Vite, Socket.io-client.
*   **Backend:** Node.js, Express, Socket.io.
  
## Getting Started

### Prerequisites
- Node.js (v18+)
- OpenSSL (to generate your own certificates)

### Installation
1. Clone the repository: `git clone https://github.com/Xenon5564/DeChat.git`
2. Generate SSL certificates: `openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365`
3. Install dependencies:
   - `cd server && npm install`
   - `cd ../client && npm install`
4. Start the app: 
   - From the root directory: `npm run dev` (Ensure you have `concurrently` installed).

## Privacy & Security
This project uses **end-to-end identity verification**. Your private keys are stored locally in your browser's `localStorage` and are never transmitted over the network. 

## License
This project is licensed under the **GNU General Public License v3.0**. See the [LICENSE](LICENSE) file for details.
