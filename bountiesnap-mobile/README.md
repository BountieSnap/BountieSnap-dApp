# BountieSnap Mobile App

A React Native mobile application for bounty hunting with location-based tasks.

## Features

- 🔐 **Authentication** - Email/password authentication with Supabase
- 🗺️ **Location-based Tasks** - Find and complete tasks near you
- 🏆 **Achievements** - Track your progress and earn rewards
- 👤 **User Profiles** - Manage your profile and view statistics
- 📱 **Cross-platform** - Works on iOS and Android

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Set up Supabase Database

You'll need to create the following tables in your Supabase database:

#### Users table (handled by Supabase Auth automatically)
The authentication is handled by Supabase's built-in auth system.

#### Optional: Extend user profiles
You can create a `profiles` table to store additional user information:

```sql
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 4. Run the App

```bash
# Start the development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## Project Structure

```
src/
├── components/         # Reusable UI components
├── context/           # React context providers
│   ├── AuthContext.tsx    # Authentication state management
│   └── BountyContext.tsx  # Bounty/task state management
├── screens/           # Main app screens
│   ├── LoginScreen.tsx
│   ├── SignUpScreen.tsx
│   ├── LoadingScreen.tsx
│   ├── MapScreen.tsx
│   ├── TasksScreen.tsx
│   ├── ProfileScreen.tsx
│   └── ...
├── utils/            # Utility functions
│   ├── supabase.ts       # Supabase client configuration
│   └── ...
└── types/            # TypeScript type definitions
```

## Authentication Flow

1. **App Launch**: Check if user is already authenticated
2. **Not Authenticated**: Show login/signup screens
3. **Authentication Success**: Navigate to main app
4. **Logout**: Return to login screen

The app uses Supabase Auth for:
- Email/password registration
- Email/password login
- Session management
- Automatic token refresh
- Secure logout

## Development

The app is built with:
- **React Native** & **Expo** for cross-platform development
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Supabase** for authentication and backend
- **Expo Linear Gradient** for beautiful UI gradients
- **React Native Maps** for location features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request