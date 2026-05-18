'use client';

import { useStreamableValue, type StreamableValue } from '@ai-sdk/rsc';
import { useState } from 'react';
import { generateNotifications } from './actions';
import type { PartialNotification } from './schema';

// 允许流式响应最长 30 秒
export const maxDuration = 30;

// 带生成 notifications 按钮的页面组件
export default function Page() {
  const [notificationStream, setNotificationStream] =
    useState<StreamableValue<PartialNotification> | null>(null);

  return (
    <div className="flex flex-col items-center min-h-screen p-4 m-4">
      <button
        className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-md"
        onClick={async () => {
          setNotificationStream(
            await generateNotifications('Messages during finals week.'),
          );
        }}
      >
        Generate notifications
      </button>

      {notificationStream && (
        <NotificationsView notificationStream={notificationStream} />
      )}
    </div>
  );
}

// 单独组件，用于展示收到可流式值的 notifications：
function NotificationsView({
  notificationStream,
}: {
  notificationStream: StreamableValue<PartialNotification>;
}) {
  const [data, pending, error] = useStreamableValue(notificationStream);

  return (
    <div className="flex flex-col gap-4 mt-4">
      {data?.notifications?.map((notification, index) => (
        <div
          className="flex items-start gap-4 p-4 bg-gray-100 rounded-md dark:bg-gray-800"
          key={index}
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-medium">{notification?.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {notification?.minutesAgo}
                {notification?.minutesAgo != null ? ' minutes ago' : ''}
              </p>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              {notification?.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
