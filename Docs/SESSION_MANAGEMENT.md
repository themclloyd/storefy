# Session Management Improvements

## Overview

This document outlines the comprehensive session management improvements implemented to solve the issue of frequent login redirects in the OS software. The solution provides robust session handling for both Supabase authentication and PIN-based sessions.

## Problem Solved

**Issue**: Users were being redirected to login on every refresh, which is bad UX for OS software that's used simultaneously by multiple users.

**Root Causes**:
1. No proper session timeout management
2. Aggressive authentication checks causing unnecessary redirects
3. Session data not persisting properly across browser refreshes
4. No user activity tracking to extend sessions automatically

## Solution Components

### 1. Session Manager (`src/lib/sessionManager.ts`)

A comprehensive singleton class that handles:
- **Session Timeout Management**: Configurable timeout periods (default 8 hours for PIN sessions)
- **Activity Tracking**: Automatic session extension based on user activity
- **Session Validation**: Proper expiry checking with graceful handling
- **Warning System**: Alerts users before session expiry

Key Features:
- Automatic session extension on user activity (throttled to every 30 seconds)
- Session expiry warnings (5 minutes before expiry by default)
- Graceful session cleanup
- Environment-based configuration

### 2. Authentication Utilities (`src/lib/authUtils.ts`)

Provides unified authentication handling:
- **Dual Auth Support**: Handles both Supabase and PIN sessions
- **Graceful Expiry**: Smart redirect logic that avoids loops
- **Session Validation**: Non-intrusive session checking
- **Safe Logout**: Proper cleanup of all session types

### 3. Protected Route Improvements (`src/components/auth/ProtectedRoute.tsx`)

Enhanced route protection with:
- **Less Aggressive Checks**: Avoids unnecessary redirects
- **Session Manager Integration**: Uses proper session validation
- **Smart Loading**: Only shows loading for essential checks
- **Loop Prevention**: Prevents redirect loops on login pages

### 4. Session Warning Component (`src/components/auth/SessionWarning.tsx`)

User-friendly session management:
- **Visual Warnings**: Toast and alert notifications
- **Session Extension**: One-click session renewal
- **Dismissible Alerts**: Non-intrusive warning system

### 5. Activity Tracker (`src/components/auth/SessionActivityTracker.tsx`)

Automatic session extension:
- **Activity Detection**: Monitors user interactions
- **Throttled Updates**: Efficient activity tracking
- **Configurable Thresholds**: Customizable activity detection

## Configuration

### Environment Variables

```env
# Session timeout in seconds (28800 = 8 hours for OS software)
VITE_SESSION_TIMEOUT=28800
```

### Default Settings

- **PIN Session Timeout**: 8 hours (configurable via environment)
- **Supabase Session**: 1 hour (handled by Supabase with auto-refresh)
- **Activity Check Interval**: 1 minute
- **Warning Before Expiry**: 5 minutes
- **Activity Threshold**: 30 seconds (minimum time between activity updates)

## Implementation Details

### Session Flow

1. **Login**: Session created with proper expiry timestamp
2. **Activity Monitoring**: User interactions extend session automatically
3. **Warning Phase**: User notified 5 minutes before expiry
4. **Expiry Handling**: Graceful cleanup and redirect (if needed)

### Session Storage

- **PIN Sessions**: localStorage with expiry timestamps
- **Supabase Sessions**: Handled by Supabase client with auto-refresh
- **Activity Data**: In-memory tracking with periodic updates

### Security Considerations

- Session data includes expiry timestamps
- Automatic cleanup of expired sessions
- Secure session validation
- No sensitive data in localStorage beyond session identifiers

## Usage Examples

### Manual Session Extension

```typescript
import { sessionManager } from '@/lib/sessionManager';

// Extend current session
sessionManager.refreshSession();

// Get session info
const info = sessionManager.getSessionInfo();
console.log(`Session expires in ${info.minutesLeft} minutes`);
```

### Activity Tracking

```typescript
import { useSessionActivity } from '@/components/auth/SessionActivityTracker';

function MyComponent() {
  const { registerActivity, isSessionValid } = useSessionActivity();
  
  const handleImportantAction = () => {
    // Manually register activity for important actions
    registerActivity();
    // ... perform action
  };
}
```

### Authentication State

```typescript
import { getAuthState, hasValidAuth } from '@/lib/authUtils';

// Check authentication without redirecting
const isAuthenticated = await hasValidAuth();

// Get detailed auth state
const authState = await getAuthState();
console.log(`Auth type: ${authState.authType}`);
```

## Benefits

1. **Better UX**: No more unexpected login redirects
2. **Longer Sessions**: 8-hour sessions suitable for OS software
3. **Activity-Based Extension**: Sessions extend automatically with use
4. **Graceful Warnings**: Users get advance notice before expiry
5. **Dual Auth Support**: Works with both Supabase and PIN sessions
6. **Performance**: Efficient activity tracking with throttling
7. **Reliability**: Robust session validation and error handling

## Testing

To test the session management:

1. **Login with PIN**: Session should persist across refreshes
2. **Activity Test**: Use the app normally - session should extend automatically
3. **Warning Test**: Wait for warning notification (or reduce timeout for testing)
4. **Expiry Test**: Let session expire - should redirect gracefully
5. **Multiple Users**: Test simultaneous usage scenarios

## Monitoring

Session information can be monitored via:

```typescript
// Get current session status
const info = sessionManager.getSessionInfo();
console.log('Session Info:', info);

// Monitor session events
sessionManager.onSessionWarning((minutes) => {
  console.log(`Session expires in ${minutes} minutes`);
});

sessionManager.onSessionExpired(() => {
  console.log('Session expired');
});
```

## Future Enhancements

1. **Session Analytics**: Track session duration and patterns
2. **Idle Detection**: More sophisticated idle user detection
3. **Multi-Tab Sync**: Synchronize sessions across browser tabs
4. **Background Refresh**: Periodic session validation in background
5. **Custom Timeouts**: Per-role or per-user timeout configurations
