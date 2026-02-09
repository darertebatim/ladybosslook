import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

/**
 * Local Notification Event Logger
 * 
 * Tracks when local notifications are scheduled, delivered, tapped, or cancelled.
 * This provides visibility into client-side notification behavior for debugging
 * and analytics purposes.
 */

export type NotificationEventType = 'scheduled' | 'delivered' | 'tapped' | 'cancelled';
export type NotificationType = 'task_reminder' | 'urgent_alarm' | 'session_reminder' | 'content_reminder';

interface LogEventParams {
  notificationType: NotificationType;
  event: NotificationEventType;
  taskId?: string;
  notificationId?: number;
  metadata?: Record<string, Json>;
}

/**
 * Log a local notification event to the database
 * Fails silently to avoid disrupting the user experience
 */
export async function logLocalNotificationEvent(params: LogEventParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[NotificationLogger] No user session, skipping log');
      return;
    }

    const { error } = await supabase
      .from('local_notification_events')
      .insert({
        user_id: user.id,
        notification_type: params.notificationType,
        event: params.event,
        task_id: params.taskId || null,
        notification_id: params.notificationId || null,
        metadata: (params.metadata || {}) as Json,
      });

    if (error) {
      console.error('[NotificationLogger] Failed to log event:', error.message);
    } else {
      console.log(`[NotificationLogger] ✓ ${params.event} ${params.notificationType}${params.taskId ? ` (task: ${params.taskId.slice(0, 8)}...)` : ''}`);
    }
  } catch (err) {
    console.error('[NotificationLogger] Error logging event:', err);
  }
}

/**
 * Batch log multiple events (e.g., when cancelling multiple notifications)
 */
export async function logLocalNotificationEventsBatch(events: LogEventParams[]): Promise<void> {
  if (events.length === 0) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rows = events.map(e => ({
      user_id: user.id,
      notification_type: e.notificationType,
      event: e.event,
      task_id: e.taskId || null,
      notification_id: e.notificationId || null,
      metadata: (e.metadata || {}) as Json,
    }));

    const { error } = await supabase
      .from('local_notification_events')
      .insert(rows);

    if (error) {
      console.error('[NotificationLogger] Batch log failed:', error.message);
    } else {
      console.log(`[NotificationLogger] ✓ Logged ${events.length} events`);
    }
  } catch (err) {
    console.error('[NotificationLogger] Batch error:', err);
  }
}
