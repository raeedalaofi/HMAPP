import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type NotificationType = 'job_offer' | 'offer_accepted' | 'offer_rejected' | 'job_completed' | 'payment_received' | 'job_cancelled' | 'system'

interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  is_read: boolean
  created_at: string
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Count unread
  const unreadCount = notifications?.filter((n: Notification) => !n.is_read).length || 0

  // Group notifications by date
  const groupedNotifications = notifications?.reduce((groups: any, notification: Notification) => {
    const date = new Date(notification.created_at).toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(notification)
    return groups
  }, {})

  // Get icon based on type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'job_offer':
        return '💼'
      case 'offer_accepted':
        return '✅'
      case 'offer_rejected':
        return '❌'
      case 'job_completed':
        return '🎉'
      case 'payment_received':
        return '💰'
      case 'job_cancelled':
        return '🚫'
      case 'system':
        return 'ℹ️'
      default:
        return '🔔'
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🔔 الإشعارات</h1>
            {unreadCount > 0 && (
              <p className="text-gray-600">لديك {unreadCount} إشعار جديد</p>
            )}
          </div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← الرئيسية
          </Link>
        </div>

        {/* Actions Bar */}
        {notifications && notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-3">
            <form action="/api/notifications/mark-all-read" method="POST" className="flex-1">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                ✓ تحديد الكل كمقروء
              </button>
            </form>
            <form action="/api/notifications/delete-all" method="POST" className="flex-1">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                onClick={(e) => {
                  if (!confirm('هل تريد حذف جميع الإشعارات؟')) {
                    e.preventDefault()
                  }
                }}
              >
                🗑️ حذف الكل
              </button>
            </form>
          </div>
        )}

        {/* Notifications List */}
        {groupedNotifications && Object.keys(groupedNotifications).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([date, items]: [string, any]) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-gray-500 mb-3 px-2">{date}</h2>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {items.map((notification: Notification, index: number) => (
                    <div
                      key={notification.id}
                      className={`${index > 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      {notification.link ? (
                        <Link
                          href={notification.link}
                          className={`block p-4 hover:bg-gray-50 transition-colors ${
                            !notification.is_read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <NotificationContent notification={notification} getIcon={getIcon} />
                        </Link>
                      ) : (
                        <div
                          className={`p-4 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                        >
                          <NotificationContent notification={notification} getIcon={getIcon} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔕</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد إشعارات</h3>
            <p className="text-gray-600">ستظهر الإشعارات هنا عند وصولها</p>
          </div>
        )}
      </div>
    </main>
  )
}

function NotificationContent({ 
  notification, 
  getIcon 
}: { 
  notification: Notification
  getIcon: (type: NotificationType) => string 
}) {
  return (
    <div className="flex gap-4">
      <div className="text-3xl">{getIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-gray-800">{notification.title}</h3>
          {!notification.is_read && (
            <span className="w-2 h-2 rounded-full bg-blue-600 ml-2 mt-1.5 flex-shrink-0"></span>
          )}
        </div>
        <p className="text-gray-700 mb-2">{notification.message}</p>
        <p className="text-xs text-gray-500">
          {new Date(notification.created_at).toLocaleString('ar-SA', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          })}
        </p>
      </div>
    </div>
  )
}
