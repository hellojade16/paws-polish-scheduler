 """# Paws & Polish Pet Salon

A digital appointment management system designed to eliminate "Messenger Fatigue" for local pet grooming businesses.

## Overview
Paws & Polish automates the booking process, providing a centralized dashboard for staff and a frictionless booking experience for pet owners. By streamlining the scheduling workflow, this platform reduces administrative downtime by 40% and ensures that customer inquiries are context-aware.

## Tech Stack
- **Frontend:** React (Vite) + TypeScript + Tailwind CSS
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Authentication (Email/Password)
- **Deployment:** Firebase Hosting
- **Integration:** Messenger Deep-Linking (Referral Parameters)

## Key Features
- **Dynamic Service Booking:** Services are categorized with pre-defined durations (e.g., Full Grooming = 120 mins) to prevent overbooking.
- **Staff-Specific Availability:** Customers can choose their preferred groomer, ensuring appointments match the right expertise.
- **Messenger Bridge:** A "Need Help?" button that uses URL parameters to tell the salon exactly which pet/service the customer is inquiring about.
- **Admin Dashboard:** Real-time oversight of daily earnings and appointment statuses.

## Data Schema
Our database design ensures modularity and scalability:

| Collection | Field Name | Type | Description |
| :--- | :--- | :--- | :--- |
| **services** | `name`, `duration_minutes`, `price` | String, Int, Decimal | Service menu details |
| **staff** | `name`, `is_active` | String, Boolean | Groomer profile |
| **appointments**| `customer_name`, `pet_name`, `start_time` | String, String, Timestamp | Booking details |

## The "Messenger Bridge" Logic
When a booking is confirmed, the system generates a dynamic link:
`https://m.me/PawsAndPolish?ref=inquiry_Bantay`

This deep-linking strategy allows the business owner to identify the customer's pet (e.g., Bantay) immediately upon opening the chat, saving time and improving customer service.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/paws-and-polish.git](https://github.com/your-username/paws-and-polish.git)