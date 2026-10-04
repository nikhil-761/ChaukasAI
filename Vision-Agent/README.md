# 👁️ Chaukas AI — Vision Agent

> An AI-powered computer vision agent that analyzes images of civic problems and identifies the problem type, category, severity, description, and confidence.

---

## 🚀 Overview

**Chaukas AI Vision Agent** is a vision-based AI component designed to automatically analyze images of civic and public infrastructure problems.

The agent receives an image, sends it to a vision-capable AI model through **KodeKey API**, and returns an intelligent analysis of the detected civic issue.

### Example

A user uploads an image of a damaged road or pothole.

The Vision Agent analyzes the image and identifies:

- Whether a civic problem exists
- Problem category
- Problem type
- Severity
- Description
- Confidence level

---

## 🎯 Problem Statement

Citizens frequently encounter civic problems such as:

- 🛣️ Potholes
- 🚧 Damaged roads
- 🗑️ Garbage accumulation
- 💡 Broken streetlights
- 🚰 Water leakage
- 🌊 Overflowing drains
- 🌳 Fallen trees
- 🏗️ Damaged public infrastructure

Manually identifying and categorizing these problems can be slow and inconsistent.

The **Chaukas AI Vision Agent** automates the initial analysis using Artificial Intelligence.

---

# 🧠 How It Works

```text
                📷 Image
                   │
                   ▼
          ┌─────────────────┐
          │   Python App    │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  Vision Agent   │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │    KodeKey API  │
          └────────┬────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Google Gemini 3.5    │
        │       Flash          │
        └──────────┬───────────┘
                   │
                   ▼
          🔍 Image Analysis
                   │
                   ▼
          📊 Civic Problem
             Detection
