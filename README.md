# 🔐 Password-Manager-RN

A secure and lightweight React Native app to store and manage your passwords locally. Built with React Native (Expo), this app keeps your credentials encrypted and safe — without using any cloud service.

---

## ✨ Features

- 🔑 Add, edit, and delete password entries (website/app, username, password)
- 🔐 AES encryption for local storage (vault is encrypted end-to-end)
- 🔓 Master password authentication
- 👆 Optional biometric login (Touch ID / Face ID)
- 🌙 Dark and light theme support
- 📋 One-tap copy to clipboard
- ⏱️ Auto logout after inactivity
- 📁 Encrypted backup and restore (JSON/QR code)

---

## 📦 Tech Stack

- React Native + Expo
- Secure local storage (AsyncStorage/MMKV/encrypted SQLite)
- AES-256 encryption + PBKDF2 for key derivation
- React Navigation
- TypeScript (if used)
- Biometric API support

---

## 🚀 Getting Started

### Prerequisites

- Node.js and npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
git clone https://github.com/shivanand0530/Password-Manager-RN.git
cd Password-Manager-RN
npm install
# or
yarn install
