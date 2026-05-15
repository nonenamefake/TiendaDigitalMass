import logging

from .models import NotificationLog

logger = logging.getLogger(__name__)


def notify(user, event: str, *, order=None, channel: str = "email", payload: dict | None = None) -> NotificationLog:
    log = NotificationLog.objects.create(
        user=user,
        order=order,
        channel=channel,
        event=event,
        payload=payload or {},
    )
    logger.info("notify channel=%s event=%s user=%s order=%s", channel, event, user.email, order.id if order else None)
    return log
