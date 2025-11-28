# iOS Push Notifications - Complete Implementation Guide

This document contains everything you need to implement iOS push notifications from scratch in a Capacitor + React + Supabase application.

---

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Apple Developer Configuration](#apple-developer-configuration)
3. [Supabase Backend Setup](#supabase-backend-setup)
4. [Xcode/Native iOS Setup](#xcodenative-ios-setup)
5. [Frontend React/TypeScript Implementation](#frontend-reacttypescript-implementation)
6. [Admin Panel Component](#admin-panel-component)
7. [Environment Configuration](#environment-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Success Checklist](#success-checklist)
10. [Key Learnings](#key-learnings)

---

## Overview & Architecture

### System Architecture

```
┌─────────────────┐
│  iOS Device     │
│  (User's Phone) │
└────────┬────────┘
         │
         │ 1. Requests permission
         │ 2. Registers with APNs
         │
         ▼
┌─────────────────────────┐
│  Apple Push Notification│
│  Service (APNs)         │
└────────┬────────────────┘
         │
         │ 3. Returns device token
         │
         ▼
┌─────────────────────────┐
│  React App              │
│  (Capacitor)            │
└────────┬────────────────┘
         │
         │ 4. Saves token to DB
         │
         ▼
┌─────────────────────────┐
│  Supabase Database      │
│  (push_subscriptions)   │
└─────────────────────────┘

         ┌─────────────────┐
         │  Admin Panel    │
         │  (Sends Push)   │
         └────────┬────────┘
                  │
                  │ 5. Triggers edge function
                  │
                  ▼
         ┌─────────────────────────┐
         │  Supabase Edge Function │
         │  (send-push-notification)│
         └────────┬────────────────┘
                  │
                  │ 6. Generates JWT
                  │ 7. Sends to APNs
                  │
                  ▼
         ┌─────────────────────────┐
         │  Apple Push Notification│
         │  Service (APNs)         │
         └────────┬────────────────┘
                  │
                  │ 8. Delivers notification
                  │
                  ▼
         ┌─────────────────┐
         │  iOS Device     │
         │  (Notification) │
         └─────────────────┘
```

### Key Components

1. **APNs (Apple Push Notification Service)**: Apple's service for delivering notifications
2. **Capacitor Push Notifications**: Bridge between native iOS and JavaScript
3. **Supabase Database**: Stores device tokens
4. **Supabase Edge Function**: Server-side logic to send notifications to APNs
5. **React Frontend**: Handles registration and user interaction

---

## Apple Developer Configuration

### Step 1: Create APNs Auth Key (.p8 file)

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
2. Click **"+"** to create a new key
3. Give it a name (e.g., "Push Notifications Key")
4. Check **"Apple Push Notifications service (APNs)"**
5. Click **Continue** → **Register**
6. **Download the .p8 file** (you can only download once!)
7. **Note the Key ID** (shown after creation, e.g., `A1B2C3D4E5`)

### Step 2: Get Your Team ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Look in the top-right corner for your **Team ID** (e.g., `Z9Y8X7W6V5`)
3. Save this value

### Step 3: Get Your Bundle ID

1. In Xcode, open your project
2. Select your app target
3. Go to **"Signing & Capabilities"** tab
4. Find **Bundle Identifier** (e.g., `com.ladybosslook.academy`)
5. This is your **APNs Topic**

### Step 4: Enable Push Notifications Capability

1. In Xcode, select your app target
2. Go to **"Signing & Capabilities"** tab
3. Click **"+ Capability"**
4. Add **"Push Notifications"**
5. Add **"Background Modes"** → Check **"Remote notifications"**

---

## Supabase Backend Setup

### Step 1: Create Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Table to store push notification subscriptions (device tokens)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL, -- Format: "native:{APNs_TOKEN}"
  p256dh_key TEXT NOT NULL, -- For native: "native-ios"
  auth_key TEXT NOT NULL, -- For native: "native-ios"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own subscriptions
CREATE POLICY "Users can manage their own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all subscriptions
CREATE POLICY "Admins can view all push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Service role can manage all (for edge functions)
CREATE POLICY "Service role can manage all subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Table to log push notification sends (for admin tracking)
CREATE TABLE push_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'user', 'course'
  target_course TEXT, -- program_slug if targeting course
  target_round_id UUID REFERENCES program_rounds(id),
  destination_url TEXT,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view logs
CREATE POLICY "Admins can view all push notification logs"
  ON push_notification_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Service role can insert logs
CREATE POLICY "Service role can insert push notification logs"
  ON push_notification_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
```

### Step 2: Configure Supabase Secrets

Add these secrets in your Supabase Dashboard → Project Settings → Edge Functions → Secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `APNS_AUTH_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----` | Full content of your .p8 file |
| `APNS_KEY_ID` | `A1B2C3D4E5` | Key ID from Apple Developer Portal |
| `APNS_TEAM_ID` | `Z9Y8X7W6V5` | Team ID from Apple Developer Portal |
| `APNS_TOPIC` | `com.ladybosslook.academy` | Your Bundle ID |
| `APNS_ENVIRONMENT` | `development` or `production` | Environment (see [Environment Configuration](#environment-configuration)) |

### Step 3: Create Edge Function

Create file: `supabase/functions/send-push-notification/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

interface PushNotificationRequest {
  title: string;
  message: string;
  destinationUrl?: string;
  targetType: 'all' | 'user' | 'course';
  userIds?: string[];
  targetUserEmail?: string;
  targetCourse?: string;
  targetRoundId?: string;
  environment?: 'development' | 'production';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert PEM to ArrayBuffer for crypto operations
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate JWT for APNs authentication
async function generateApnsJwt(authKey: string, keyId: string, teamId: string): Promise<string> {
  const pemKey = pemToArrayBuffer(authKey);
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemKey,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['sign']
  );

  const jwt = await create(
    { alg: 'ES256', kid: keyId },
    {
      iss: teamId,
      iat: getNumericDate(new Date()),
    },
    cryptoKey
  );

  return jwt;
}

// Send notification to APNs
async function sendToApns(
  token: string,
  payload: { title: string; body: string; url: string; badge?: number },
  environmentOverride?: 'development' | 'production'
): Promise<Response> {
  const authKey = Deno.env.get('APNS_AUTH_KEY')!;
  const keyId = Deno.env.get('APNS_KEY_ID')!;
  const teamId = Deno.env.get('APNS_TEAM_ID')!;
  const topic = Deno.env.get('APNS_TOPIC')!;
  const configuredEnvironment = Deno.env.get('APNS_ENVIRONMENT') || 'development';
  
  // Use override if provided, otherwise use configured environment
  const environment = environmentOverride || configuredEnvironment;

  const jwt = await generateApnsJwt(authKey, keyId, teamId);

  const apnsUrl = environment === 'production'
    ? 'https://api.push.apple.com'
    : 'https://api.sandbox.push.apple.com';

  const apnsPayload = {
    aps: {
      alert: {
        title: payload.title,
        body: payload.body,
      },
      badge: payload.badge || 0,
      sound: 'default',
      'mutable-content': 1,
    },
    url: payload.url,
  };

  console.log(`Sending to APNs (${environment}):`, apnsUrl, 'token:', token.substring(0, 20) + '...');

  return await fetch(`${apnsUrl}/3/device/${token}`, {
    method: 'POST',
    headers: {
      'authorization': `bearer ${jwt}`,
      'apns-topic': topic,
      'apns-push-type': 'alert',
      'apns-priority': '10',
    },
    body: JSON.stringify(apnsPayload),
  });
}

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Parse request
    const { 
      title, 
      message, 
      destinationUrl, 
      targetType, 
      userIds, 
      targetUserEmail, 
      targetCourse,
      targetRoundId,
      environment 
    }: PushNotificationRequest = await req.json();

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = await userResponse.json();
    
    // Check if user is admin
    const roleCheckResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${user.id}&role=eq.admin`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    const roles = await roleCheckResponse.json();
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch subscriptions based on target
    let subscriptionsQuery = `${supabaseUrl}/rest/v1/push_subscriptions?select=*`;

    if (targetType === 'user' && userIds && userIds.length > 0) {
      subscriptionsQuery += `&user_id=in.(${userIds.join(',')})`;
    } else if (targetType === 'user' && targetUserEmail) {
      // Get user by email first
      const profileResponse = await fetch(
        `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(targetUserEmail)}&select=id`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        }
      );
      const profiles = await profileResponse.json();
      if (profiles && profiles.length > 0) {
        subscriptionsQuery += `&user_id=eq.${profiles[0].id}`;
      } else {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (targetType === 'course' && targetCourse) {
      // Get enrolled users
      const enrollmentResponse = await fetch(
        `${supabaseUrl}/rest/v1/course_enrollments?program_slug=eq.${targetCourse}&status=eq.active&select=user_id`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        }
      );
      const enrollments = await enrollmentResponse.json();
      if (enrollments && enrollments.length > 0) {
        const enrolledUserIds = enrollments.map((e: any) => e.user_id);
        subscriptionsQuery += `&user_id=in.(${enrolledUserIds.join(',')})`;
      } else {
        return new Response(JSON.stringify({ error: 'No enrolled users found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const subscriptionsResponse = await fetch(subscriptionsQuery, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
    });

    const subscriptions = await subscriptionsResponse.json();

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ error: 'No subscriptions found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send notifications
    let sentCount = 0;
    let failedCount = 0;
    const invalidTokens: string[] = [];

    for (const subscription of subscriptions) {
      try {
        // Extract native token (format: "native:TOKEN")
        const token = subscription.endpoint.replace('native:', '');
        
        const response = await sendToApns(
          token,
          {
            title,
            body: message,
            url: destinationUrl || '/app/home',
          },
          environment // Pass environment override
        );

        console.log(`APNs response for ${token.substring(0, 20)}:`, response.status);

        if (response.status === 200) {
          sentCount++;
        } else {
          failedCount++;
          
          // Mark invalid tokens for deletion (410 = token no longer valid, 400 = bad token)
          if (response.status === 410 || response.status === 400) {
            invalidTokens.push(subscription.id);
          }
        }
      } catch (error) {
        console.error('Error sending to APNs:', error);
        failedCount++;
      }
    }

    // Delete invalid tokens
    if (invalidTokens.length > 0) {
      await fetch(
        `${supabaseUrl}/rest/v1/push_subscriptions?id=in.(${invalidTokens.join(',')})`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        }
      );
      console.log(`Deleted ${invalidTokens.length} invalid tokens`);
    }

    // Log the notification
    await fetch(`${supabaseUrl}/rest/v1/push_notification_logs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        message,
        destination_url: destinationUrl,
        target_type: targetType,
        target_course: targetCourse,
        target_round_id: targetRoundId,
        sent_count: sentCount,
        failed_count: failedCount,
        created_by: user.id,
      }),
    });

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        failedCount,
        invalidTokensRemoved: invalidTokens.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

serve(handler);
```

---

## Xcode/Native iOS Setup

### Critical: AppDelegate.swift Modifications

**This is the most critical step that causes registration failures if missed!**

File: `ios/App/App/AppDelegate.swift`

Add these two methods to bridge APNs tokens to Capacitor:

```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive.
    }

    func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // CRITICAL: Push Notification Bridge Methods
    // These methods forward APNs registration events to Capacitor
    // WITHOUT THESE, push notification registration will timeout!

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Forward the token to Capacitor
        NotificationCenter.default.post(
            name: .capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        // Forward the error to Capacitor
        NotificationCenter.default.post(
            name: .capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )
    }
}
```

### Why These Methods Are Critical

- Capacitor's `PushNotifications.register()` calls iOS's native registration
- iOS calls these delegate methods with the result
- Without these methods, the result never reaches JavaScript
- This causes the 15-second timeout in `subscribeToPushNotifications()`

### Xcode Capabilities

Ensure these are enabled in Xcode → Signing & Capabilities:

1. **Push Notifications** (add via "+ Capability")
2. **Background Modes** → Check **"Remote notifications"**

---

## Frontend React/TypeScript Implementation

### Step 1: Install Capacitor Packages

```bash
npm install @capacitor/core @capacitor/push-notifications
```

### Step 2: Create Push Notifications Library

File: `src/lib/pushNotifications.ts`

```typescript
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Navigation callback for deep linking
let navigationCallback: ((url: string) => void) | null = null;

export const registerNavigationCallback = (callback: (url: string) => void) => {
  navigationCallback = callback;
};

const handleDeepLink = (url: string) => {
  console.log('Deep link clicked:', url);
  if (navigationCallback) {
    navigationCallback(url);
  } else {
    window.location.href = url;
  }
};

// Initialize notification handlers (call once at app startup)
export const initializePushNotificationHandlers = () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications: Not a native platform, skipping handlers');
    return;
  }

  console.log('Initializing push notification handlers...');

  // Foreground notification handler
  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('Foreground push notification received:', notification);
    
    const url = (notification.data as any)?.url || '/app/home';
    
    toast(notification.title || 'New Notification', {
      description: notification.body,
      action: {
        label: 'View',
        onClick: () => handleDeepLink(url),
      },
      duration: 5000,
    });
  });

  // Background/closed notification handler (user taps notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    console.log('Push notification action performed:', action);
    
    const url = action.notification.data?.url || '/app/home';
    handleDeepLink(url);
  });

  console.log('Push notification handlers initialized');
};

// Clear app badge count
export const clearBadge = async () => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    await PushNotifications.removeAllDeliveredNotifications();
    console.log('Badge cleared');
  } catch (error) {
    console.error('Error clearing badge:', error);
  }
};

// Get current badge count (iOS only)
export const getBadgeCount = async (): Promise<number> => {
  if (!Capacitor.isNativePlatform()) return 0;
  
  try {
    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications.length;
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
};

// Check permission status
export const checkPermissionStatus = async () => {
  if (!Capacitor.isNativePlatform()) {
    return { receive: 'denied' };
  }

  try {
    const permStatus = await PushNotifications.checkPermissions();
    console.log('Permission status:', permStatus);
    return permStatus;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return { receive: 'denied' };
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not on native platform, skipping permission request');
    return { receive: 'denied' };
  }

  try {
    console.log('Requesting notification permission...');
    const permStatus = await PushNotifications.requestPermissions();
    console.log('Permission result:', permStatus);
    return permStatus;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    throw error;
  }
};

// Subscribe to push notifications (register device)
export const subscribeToPushNotifications = async (userId: string) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications: Not available on web');
    throw new Error('Push notifications are only available on native platforms');
  }

  if (!userId) {
    console.error('Push notifications: userId is required');
    throw new Error('User ID is required');
  }

  console.log('Starting push notification subscription for user:', userId);

  try {
    // Check if subscription already exists in database
    const { data: existingSubscriptions, error: checkError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .like('endpoint', 'native:%');

    if (checkError) {
      console.error('Error checking existing subscriptions:', checkError);
      throw checkError;
    }

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      console.log('Native subscription already exists, skipping APNs registration');
      return { success: true, message: 'Already subscribed' };
    }

    // Check permission status first
    const permStatus = await checkPermissionStatus();
    if (permStatus.receive === 'denied') {
      throw new Error('Push notification permission denied. Please enable in Settings.');
    }

    if (permStatus.receive !== 'granted') {
      const requestResult = await requestNotificationPermission();
      if (requestResult.receive !== 'granted') {
        throw new Error('Push notification permission not granted');
      }
    }

    // Set up registration listeners BEFORE calling register()
    let registrationHandled = false;

    const registrationPromise = new Promise<Token>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!registrationHandled) {
          registrationHandled = true;
          reject(new Error('Registration timeout after 20 seconds'));
        }
      }, 20000);

      PushNotifications.addListener('registration', (token: Token) => {
        if (!registrationHandled) {
          registrationHandled = true;
          clearTimeout(timeout);
          console.log('Push registration success:', token);
          resolve(token);
        }
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        if (!registrationHandled) {
          registrationHandled = true;
          clearTimeout(timeout);
          console.error('Push registration error:', error);
          reject(new Error(error.error || 'Registration failed'));
        }
      });
    });

    // Now trigger registration
    console.log('Calling PushNotifications.register()...');
    await PushNotifications.register();

    // Wait for token
    const token = await registrationPromise;

    // Save token to database
    const endpoint = `native:${token.value}`;
    
    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        endpoint: endpoint,
        p256dh_key: 'native-ios',
        auth_key: 'native-ios',
      });

    if (insertError) {
      console.error('Error saving subscription:', insertError);
      throw insertError;
    }

    console.log('Push notification subscription successful');
    return { success: true, token: token.value };

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (userId: string) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not on native platform');
    return;
  }

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .like('endpoint', 'native:%');

    if (error) throw error;

    console.log('Unsubscribed from push notifications');
  } catch (error) {
    console.error('Error unsubscribing:', error);
    throw error;
  }
};
```

### Step 3: Initialize in App Entry Point

File: `src/main.tsx` (or wherever your app initializes)

```typescript
import { initializePushNotificationHandlers, registerNavigationCallback } from '@/lib/pushNotifications';
import { useNavigate } from 'react-router-dom';

// In your root component or App.tsx
useEffect(() => {
  // Register navigation callback for deep linking
  const navigate = useNavigate();
  registerNavigationCallback((url) => {
    const path = url.replace(window.location.origin, '');
    navigate(path);
  });

  // Initialize push notification handlers
  initializePushNotificationHandlers();
}, []);
```

### Step 4: Permission Prompt Component

File: `src/components/app/PushNotificationPrompt.tsx`

```typescript
import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Bell } from 'lucide-react';
import { subscribeToPushNotifications, requestNotificationPermission } from '@/lib/pushNotifications';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

interface PushNotificationPromptProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

export const PushNotificationPrompt = ({ userId, open, onClose }: PushNotificationPromptProps) => {
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.error('Push notifications are only available in the mobile app');
      onClose();
      return;
    }

    setIsEnabling(true);
    try {
      // Request permission first
      const permStatus = await requestNotificationPermission();
      
      if (permStatus.receive === 'granted') {
        // Subscribe to push notifications
        await subscribeToPushNotifications(userId);
        toast.success('Push notifications enabled!');
        onClose();
      } else {
        toast.error('Permission denied. Please enable in Settings.');
        onClose();
      }
    } catch (error: any) {
      console.error('Error enabling push notifications:', error);
      toast.error(error.message || 'Failed to enable push notifications');
      onClose();
    } finally {
      setIsEnabling(false);
    }
  };

  const handleMaybeLater = () => {
    // Store flag to not show again for 3 days
    localStorage.setItem('push-notification-prompt-dismissed', Date.now().toString());
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle>Stay Updated!</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Enable push notifications to receive important course updates, announcements, and reminders directly on your device.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleMaybeLater} disabled={isEnabling}>
            Maybe Later
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleEnable} disabled={isEnabling}>
            {isEnabling ? 'Enabling...' : 'Enable'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

### Step 5: Profile Settings Integration

Add notification settings to your profile page:

```typescript
import { checkPermissionStatus, subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/lib/pushNotifications';

// In your Profile component
const [notificationsEnabled, setNotificationsEnabled] = useState(false);

useEffect(() => {
  const checkStatus = async () => {
    const status = await checkPermissionStatus();
    setNotificationsEnabled(status.receive === 'granted');
  };
  checkStatus();
}, []);

const toggleNotifications = async () => {
  try {
    if (notificationsEnabled) {
      await unsubscribeFromPushNotifications(userId);
      setNotificationsEnabled(false);
      toast.success('Notifications disabled');
    } else {
      await subscribeToPushNotifications(userId);
      setNotificationsEnabled(true);
      toast.success('Notifications enabled');
    }
  } catch (error: any) {
    toast.error(error.message);
  }
};
```

---

## Admin Panel Component

File: `src/components/admin/PushNotificationSender.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Smartphone } from 'lucide-react';

interface NotificationFormProps {
  environment: 'development' | 'production';
}

const NotificationForm = ({ environment }: NotificationFormProps) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('/app/home');
  const [targetType, setTargetType] = useState<'all' | 'user' | 'course'>('all');
  const [targetCourse, setTargetCourse] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !message) {
      toast.error('Please fill in title and message');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          message,
          destinationUrl,
          targetType,
          targetCourse: targetType === 'course' ? targetCourse : undefined,
          targetUserEmail: targetType === 'user' ? targetEmail : undefined,
          environment, // Pass environment parameter
        },
      });

      if (error) throw error;

      toast.success(`Notification sent! Delivered: ${data.sentCount}, Failed: ${data.failedCount}`);
      
      // Reset form
      setTitle('');
      setMessage('');
      setDestinationUrl('/app/home');
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`title-${environment}`}>Notification Title</Label>
        <Input
          id={`title-${environment}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New Course Update!"
        />
      </div>

      <div>
        <Label htmlFor={`message-${environment}`}>Message</Label>
        <Textarea
          id={`message-${environment}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Check out the latest course materials..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor={`url-${environment}`}>Destination URL</Label>
        <Input
          id={`url-${environment}`}
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          placeholder="/app/home"
        />
      </div>

      <div>
        <Label htmlFor={`target-${environment}`}>Target Audience</Label>
        <Select value={targetType} onValueChange={(value: any) => setTargetType(value)}>
          <SelectTrigger id={`target-${environment}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="user">Specific User</SelectItem>
            <SelectItem value="course">Course Enrollees</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {targetType === 'user' && (
        <div>
          <Label htmlFor={`email-${environment}`}>User Email</Label>
          <Input
            id={`email-${environment}`}
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </div>
      )}

      {targetType === 'course' && (
        <div>
          <Label htmlFor={`course-${environment}`}>Program Slug</Label>
          <Input
            id={`course-${environment}`}
            value={targetCourse}
            onChange={(e) => setTargetCourse(e.target.value)}
            placeholder="courageous-character-course"
          />
        </div>
      )}

      <Button onClick={handleSend} disabled={sending} className="w-full">
        <Send className="h-4 w-4 mr-2" />
        {sending ? 'Sending...' : 'Send Notification'}
      </Button>

      {/* Preview */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Smartphone className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-semibold">{title || 'Notification Title'}</p>
              <p className="text-sm text-muted-foreground">{message || 'Notification message'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const PushNotificationSender = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Development Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            Test Push Notification
          </CardTitle>
          <CardDescription>
            Send to development environment (Xcode builds, TestFlight)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationForm environment="development" />
        </CardContent>
      </Card>

      {/* Production Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            Production Push Notification
          </CardTitle>
          <CardDescription>
            Send to production environment (App Store builds)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationForm environment="production" />
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## Environment Configuration

### Development vs Production

You have two APNs environments:

| Environment | When to Use | APNS_ENVIRONMENT Secret |
|------------|-------------|------------------------|
| **Development** | Xcode debug builds, TestFlight internal testing | `development` |
| **Production** | App Store releases | `production` |

### How to Switch Environments

**In Supabase:**
1. Go to Project Settings → Edge Functions → Secrets
2. Edit `APNS_ENVIRONMENT`
3. Change value to `development` or `production`

**Important Notes:**
- The same `.p8` Auth Key works for both environments
- Only `APNS_ENVIRONMENT` needs to change
- Always use `development` for testing in Xcode or TestFlight
- Switch to `production` before App Store submission

---

## Troubleshooting

### Issue 1: Registration Timeout (15-20 seconds)

**Symptoms:**
- `subscribeToPushNotifications()` times out
- No token received
- Console shows: "Registration timeout after 20 seconds"

**Causes & Solutions:**

1. **Missing AppDelegate.swift methods** (most common)
   - Solution: Add the two bridge methods to `AppDelegate.swift` (see [Xcode Setup](#xcodenative-ios-setup))

2. **Xcode capabilities not enabled**
   - Solution: Enable "Push Notifications" and "Background Modes → Remote notifications"

3. **Permission denied**
   - Solution: Check iOS Settings → [Your App] → Notifications

4. **Wrong APNs environment**
   - Solution: Use `development` for Xcode/TestFlight builds

### Issue 2: Token Received But Notifications Not Arriving

**Symptoms:**
- Registration succeeds
- Token saved to database
- But notifications don't show up

**Causes & Solutions:**

1. **Wrong APNS_ENVIRONMENT**
   - Development tokens only work with sandbox APNs
   - Production tokens only work with production APNs
   - Solution: Match environment to build type

2. **Invalid APNs Auth Key**
   - Solution: Regenerate .p8 file and update `APNS_AUTH_KEY` secret

3. **Wrong Bundle ID**
   - Solution: Verify `APNS_TOPIC` matches your actual Bundle ID

4. **Token expired/invalid**
   - Solution: Edge function automatically removes invalid tokens (410/400 responses)

### Issue 3: Notifications Work in Foreground But Not Background

**Symptoms:**
- Toast appears when app is open
- Nothing happens when app is in background

**Solution:**
- Ensure "Background Modes → Remote notifications" is enabled in Xcode
- Check that `pushNotificationActionPerformed` listener is registered

### Issue 4: Deep Linking Not Working

**Symptoms:**
- Notification arrives
- Clicking it doesn't navigate to correct page

**Solution:**
- Ensure `registerNavigationCallback()` is called before handlers
- Verify `destinationUrl` in notification payload is correct
- Check that the URL path exists in your app's routes

### Issue 5: Push Notifications Don't Work on Simulator

**This is expected behavior:**
- iOS Simulator does NOT support push notifications
- You MUST test on a real iOS device
- Use TestFlight or Xcode to deploy to a physical device

---

## Success Checklist

### Backend Setup ✓
- [ ] `push_subscriptions` table created with RLS policies
- [ ] `push_notification_logs` table created with RLS policies
- [ ] All 5 APNs secrets configured in Supabase
- [ ] `send-push-notification` edge function deployed
- [ ] Edge function tested in Supabase Functions logs

### iOS/Xcode Setup ✓
- [ ] Downloaded .p8 file from Apple Developer
- [ ] Noted Key ID and Team ID
- [ ] Push Notifications capability enabled in Xcode
- [ ] Background Modes → Remote notifications enabled
- [ ] **AppDelegate.swift bridge methods added** (critical!)

### Frontend Setup ✓
- [ ] `@capacitor/push-notifications` installed
- [ ] `src/lib/pushNotifications.ts` created
- [ ] `initializePushNotificationHandlers()` called at app startup
- [ ] `registerNavigationCallback()` set up with React Router
- [ ] Permission prompt component created
- [ ] Profile settings integration added

### Testing ✓
- [ ] Tested registration on real iOS device (not simulator)
- [ ] Verified token saved to database with `native:` prefix
- [ ] Sent test notification from admin panel (development environment)
- [ ] Notification received in foreground (toast appears)
- [ ] Notification received in background (banner appears)
- [ ] Notification received when app is closed
- [ ] Deep linking works (clicking notification navigates correctly)
- [ ] Badge count updates correctly
- [ ] Invalid tokens removed from database automatically

### Production Readiness ✓
- [ ] Changed `APNS_ENVIRONMENT` to `production` in Supabase secrets
- [ ] Tested production notifications with App Store build
- [ ] Admin panel has separate dev/prod notification cards
- [ ] Documentation updated for team/future reference

---

## Key Learnings

### Critical Success Factors

1. **AppDelegate.swift is Everything**
   - The two bridge methods are 100% required
   - They are NOT auto-generated by Capacitor
   - Without them, registration will always timeout
   - Document this in your team's setup guides

2. **Permission Request Must Come First**
   - Always call `requestNotificationPermission()` before `subscribeToPushNotifications()`
   - iOS won't register without permission granted

3. **Environment Must Match Build Type**
   - Xcode debug builds → `development`
   - TestFlight → `development`
   - App Store → `production`
   - Mismatched environment = notifications won't arrive

4. **Simulator Won't Work**
   - Don't waste time debugging on simulator
   - Always test on real iOS device

5. **Database as Source of Truth**
   - Check database before calling APNs register()
   - Prevents duplicate registration attempts
   - Eliminates timeout issues

### Architecture Decisions

1. **Native-Only Approach**
   - Removed all PWA/web push infrastructure
   - Simplified to iOS-only via Capacitor
   - Eliminated conflicts between web/native

2. **Centralized Permission Management**
   - Profile page is single control point
   - Simple popup on first launch
   - Non-intrusive banner for reminders

3. **JWT-Based APNs Authentication**
   - More secure than certificate-based
   - Easier to rotate credentials
   - No certificate expiration issues

4. **Automatic Token Cleanup**
   - Edge function removes invalid tokens (410/400)
   - Keeps database clean
   - Improves delivery success rate

### Best Practices

1. **Logging is Your Friend**
   - Log every step of registration process
   - Log APNs responses (especially error codes)
   - Makes debugging 10x faster

2. **Test All App States**
   - Foreground (app open)
   - Background (app minimized)
   - Closed (app not running)
   - Each state has different notification handling

3. **Deep Linking Requires Planning**
   - Design URL structure early
   - Test navigation from all app states
   - Handle edge cases (logged out, invalid routes)

4. **Admin Tools Are Essential**
   - Separate dev/prod sending interfaces
   - Preview before sending
   - Track sent/failed counts
   - View notification logs

---

## Additional Resources

- [Apple Push Notifications Documentation](https://developer.apple.com/documentation/usernotifications)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [APNs Provider API](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## Conclusion

Implementing iOS push notifications is complex but achievable by following this guide systematically. The most critical steps are:

1. Adding AppDelegate.swift bridge methods
2. Configuring APNs credentials correctly
3. Matching environment to build type
4. Testing on real devices

Once set up correctly, the system is reliable and scales well. Good luck! 🚀
