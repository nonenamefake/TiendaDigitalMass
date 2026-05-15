from django.contrib import admin

from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "channel", "order", "created_at")
    list_filter = ("channel", "event")
    search_fields = ("user__email", "event")
