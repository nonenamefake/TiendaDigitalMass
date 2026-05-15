from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.cart.models import Cart
from apps.catalog.models import Inventory
from apps.notifications.services import notify
from apps.payments.gateway import PaymentGatewayStub
from apps.payments.models import Payment

from .models import Order, OrderItem


class CheckoutError(ValidationError):
    pass


@transaction.atomic
def checkout(
    *,
    user,
    cart: Cart,
    delivery_mode: str,
    payment_method: str,
    address_id: int | None,
    delivery_date,
    delivery_slot: str,
    idempotency_key: str = "",
) -> Order:
    if idempotency_key:
        existing = Order.objects.filter(user=user, idempotency_key=idempotency_key).first()
        if existing:
            return existing

    if cart.store is None:
        raise CheckoutError("Selecciona una tienda antes de comprar.")
    if not cart.items.exists():
        raise CheckoutError("El carrito esta vacio.")
    if delivery_mode == Order.DeliveryMode.DELIVERY and not address_id:
        raise CheckoutError("Necesitas una direccion para delivery.")

    items = list(cart.items.select_related("product"))
    inv_map = {
        inv.product_id: inv
        for inv in Inventory.objects.select_for_update().filter(
            store=cart.store, product_id__in=[i.product_id for i in items]
        )
    }
    for it in items:
        inv = inv_map.get(it.product_id)
        if not inv or inv.stock_qty < it.qty:
            raise CheckoutError(f"Sin stock suficiente de {it.product.name} en la tienda seleccionada.")

    subtotal = sum((Decimal(it.unit_price_snapshot) * it.qty for it in items), Decimal("0"))
    order = Order.objects.create(
        user=user,
        store=cart.store,
        delivery_mode=delivery_mode,
        delivery_date=delivery_date,
        delivery_slot=delivery_slot or "",
        address_id=address_id if delivery_mode == Order.DeliveryMode.DELIVERY else None,
        payment_method=payment_method,
        subtotal=subtotal,
        discount=Decimal("0"),
        total=subtotal,
        idempotency_key=idempotency_key or "",
    )
    for it in items:
        OrderItem.objects.create(
            order=order,
            product=it.product,
            sku_snapshot=it.product.sku,
            name_snapshot=it.product.name,
            image_snapshot=it.product.image_url,
            qty=it.qty,
            unit_price=it.unit_price_snapshot,
            line_total=Decimal(it.unit_price_snapshot) * it.qty,
        )
        inv = inv_map[it.product_id]
        inv.stock_qty -= it.qty
        inv.save(update_fields=["stock_qty"])

    Payment.objects.create(
        order=order,
        method=payment_method,
        amount=order.total,
        currency=order.currency,
    )

    cart.items.all().delete()
    cart.store = None
    cart.save(update_fields=["store"])

    notify(user, event="order_created", order=order, payload={"total": str(order.total), "items": len(items)})
    return order


@transaction.atomic
def confirm_mock_payment(order: Order) -> Order:
    if order.status != Order.Status.PENDING_PAYMENT:
        raise ValidationError("La orden no esta pendiente de pago.")
    gateway = PaymentGatewayStub()
    result = gateway.charge(method=order.payment_method, amount=order.total, currency=order.currency,
                            metadata={"order_id": order.id})
    payment = order.payment
    payment.mock_reference = result.reference
    if result.approved:
        payment.status = Payment.Status.APPROVED
        payment.paid_at = datetime.now(timezone.utc)
        payment.save(update_fields=["status", "mock_reference", "paid_at"])
        order.status = Order.Status.PAID
        order.save(update_fields=["status", "updated_at"])
        notify(order.user, event="order_paid", order=order, payload={"reference": result.reference})
    else:
        payment.status = Payment.Status.REJECTED
        payment.save(update_fields=["status", "mock_reference"])
        notify(order.user, event="payment_rejected", order=order, payload={"reference": result.reference})
    return order


@transaction.atomic
def cancel_order(order: Order) -> Order:
    if not order.is_cancelable:
        raise ValidationError("La orden ya no se puede cancelar.")
    for it in order.items.select_related("product"):
        inv = Inventory.objects.select_for_update().filter(store=order.store, product=it.product).first()
        if inv:
            inv.stock_qty += it.qty
            inv.save(update_fields=["stock_qty"])
    order.status = Order.Status.CANCELLED
    order.cancelled_at = datetime.now(timezone.utc)
    order.save(update_fields=["status", "cancelled_at", "updated_at"])
    notify(order.user, event="order_cancelled", order=order)
    return order


@transaction.atomic
def repeat_order(order: Order) -> Cart:
    cart, _ = Cart.objects.get_or_create(user=order.user)
    cart.store = order.store
    cart.save(update_fields=["store"])
    cart.items.all().delete()
    from apps.cart.models import CartItem
    for it in order.items.all():
        if not it.product.is_active:
            continue
        CartItem.objects.create(
            cart=cart,
            product=it.product,
            qty=it.qty,
            unit_price_snapshot=it.product.price,
        )
    return cart
