// Firebase Cloud Messaging Service Worker
// Этот файл должен быть в корне public папки для работы с FCM

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Инициализация Firebase в Service Worker
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

firebase.initializeApp(firebaseConfig);

// Получаем экземпляр Firebase Messaging
const messaging = firebase.messaging();

// Обработка фоновых сообщений
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icons/notification-icon.png',
    badge: payload.notification.badge || '/icons/badge.png',
    data: payload.data,
    tag: `notification-${payload.data?.notification_id || Date.now()}`,
    requireInteraction: payload.data?.priority === 'high',
    actions: [
      {
        action: 'open',
        title: 'Открыть',
        icon: '/icons/open-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Закрыть',
        icon: '/icons/dismiss-icon.png'
      }
    ]
  };

  // Показываем уведомление
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Открываем приложение при клике на уведомление
  const urlToOpen = event.notification.data?.action_url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Проверяем, есть ли уже открытое окно приложения
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      
      // Если нет открытого окна, открываем новое
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Обработка закрытия уведомлений
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
  
  // Можно отправить аналитику о том, что уведомление было закрыто
  if (event.notification.data?.notification_id) {
    // Отправить событие о закрытии уведомления на сервер
    fetch('/api/notifications/close/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_id: event.notification.data.notification_id
      })
    }).catch(err => console.log('Failed to send close event:', err));
  }
});
