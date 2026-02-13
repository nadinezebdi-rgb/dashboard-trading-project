'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export default function PushNotificationManager({ token }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setIsSupported(false);
      setIsLoading(false);
    }
  }, [token]);

  const checkSubscription = async () => {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Check permission state
      setPermission(Notification.permission);

      // Check existing subscription
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      // Also check backend status
      if (token) {
        const response = await fetch(`${API_URL}/api/push/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.enabled && data.subscription_exists);
        }
      }
    } catch (error) {
      console.error('Error checking push subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    if (!token) {
      toast.error('Connecte-toi pour activer les notifications');
      return;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast.error('Permission refusée pour les notifications');
        setIsLoading(false);
        return;
      }

      // Get VAPID key from backend
      const vapidResponse = await fetch(`${API_URL}/api/push/vapid-key`);
      const { publicKey } = await vapidResponse.json();

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send subscription to backend
      const response = await fetch(`${API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
          }
        })
      });

      if (response.ok) {
        setIsSubscribed(true);
        toast.success('Notifications activées !');
      } else {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Erreur lors de l\'activation des notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from backend
      if (token) {
        await fetch(`${API_URL}/api/push/subscribe`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setIsSubscribed(false);
      toast.success('Notifications désactivées');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Erreur lors de la désactivation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <BellOff className="w-4 h-4" />
        <span>Notifications non supportées</span>
      </div>
    );
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading || permission === 'denied'}
      className={`flex items-center gap-2 px-3 py-2 rounded-sm transition-all ${
        isSubscribed
          ? 'bg-primary/10 text-primary border border-primary/30'
          : 'bg-secondary hover:bg-secondary/80'
      } ${isLoading ? 'opacity-50' : ''}`}
      title={permission === 'denied' ? 'Permission refusée dans le navigateur' : ''}
      data-testid="push-notification-toggle"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span className="text-sm">
        {isLoading
          ? 'Chargement...'
          : permission === 'denied'
          ? 'Bloqué'
          : isSubscribed
          ? 'Notifications ON'
          : 'Activer notifs'}
      </span>
    </button>
  );
}
