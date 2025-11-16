'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  Trash2,
  X,
  Calendar,
  CheckCircle,
  XCircle,
  PartyPopper,
  Clock,
  Edit,
  Star,
  DollarSign,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll
  } = useNotifications();

  const [open, setOpen] = useState(false);

  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navegar al link si existe
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await markAllAsRead();
  };

  const handleDeleteAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
      await deleteAll();
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    const iconMap: Record<string, { icon: React.ReactElement; color: string }> = {
      appointment_created: {
        icon: <Calendar className={iconClass} />,
        color: 'text-blue-500'
      },
      appointment_confirmed: {
        icon: <CheckCircle className={iconClass} />,
        color: 'text-green-500'
      },
      appointment_cancelled: {
        icon: <XCircle className={iconClass} />,
        color: 'text-red-500'
      },
      appointment_completed: {
        icon: <PartyPopper className={iconClass} />,
        color: 'text-purple-500'
      },
      appointment_reminder: {
        icon: <Clock className={iconClass} />,
        color: 'text-orange-500'
      },
      appointment_updated: {
        icon: <Edit className={iconClass} />,
        color: 'text-yellow-500'
      },
      review_received: {
        icon: <Star className={iconClass} />,
        color: 'text-amber-500'
      },
      payment_received: {
        icon: <DollarSign className={iconClass} />,
        color: 'text-emerald-500'
      },
      system_message: {
        icon: <Megaphone className={iconClass} />,
        color: 'text-slate-500'
      }
    };

    const defaultIcon = {
      icon: <Bell className={iconClass} />,
      color: 'text-gray-500'
    };

    return iconMap[type] || defaultIcon;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAll}
                className="h-8 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Bell className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No tienes notificaciones
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Te avisaremos cuando tengas novedades
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-accent/50 cursor-pointer transition-colors relative',
                    !notification.read && 'bg-accent/20'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="absolute top-4 right-4">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-accent",
                      getNotificationIcon(notification.type).color
                    )}>
                      {getNotificationIcon(notification.type).icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight mb-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: es
                          })}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-xs"
                onClick={() => {
                  setOpen(false);
                  // TODO: Navegar a página de todas las notificaciones
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
