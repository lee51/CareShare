# CareShare - Project Vision & Features

## Project Vision & Scope
- The app handles both **Pet Care** and **Person Care**. 
- Currently, we are focusing strictly on the **Pet Care** portion (options: dog, cat).
- The data model is centered around the dependent (the pet).
- One dependent can have multiple caretakers (users). 
- Caretakers collaborate to log care actions and converse in real-time.

## Key Features & Guidelines
- **Quick Logging**: Users must be able to record care actions instantly. The UI should prioritize speed, accessibility, and ease of use on mobile devices.
- **Customizable Actions**: Activity types (food, pee, poop, nap, walk, play, train, vet, medicine) are defaults, but users can configure which ones appear on the dependent's home screen via their settings.
- **Activity Feed**: A chronological view of recent activities, which supports custom timestamps and optional comments.
- **Chat**: Caretakers for a specific dependent can converse with each other in real-time.
- **Authentication**: Strictly Email-based Magic Links via Supabase Auth (no passwords, no third-party providers).
