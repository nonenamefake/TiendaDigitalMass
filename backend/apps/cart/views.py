from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product, Store

from .models import Cart, CartItem
from .serializers import (
    CartItemCreateSerializer,
    CartItemPatchSerializer,
    CartItemReadSerializer,
    CartSerializer,
    SetStoreSerializer,
)


def _get_or_create_cart(user) -> Cart:
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = _get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data)

    def delete(self, request):
        cart = _get_or_create_cart(request.user)
        cart.items.all().delete()
        cart.store = None
        cart.save(update_fields=["store"])
        return Response(CartSerializer(cart).data)


class CartStoreView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = SetStoreSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        cart = _get_or_create_cart(request.user)
        store = Store.objects.get(code=ser.validated_data["store_code"])
        cart.store = store
        cart.save(update_fields=["store"])
        return Response(CartSerializer(cart).data)


class CartItemsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = CartItemCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        cart = _get_or_create_cart(request.user)
        product = Product.objects.get(pk=ser.validated_data["product_id"])
        qty = ser.validated_data["qty"]

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"qty": qty, "unit_price_snapshot": product.price},
        )
        if not created:
            item.qty += qty
            item.unit_price_snapshot = product.price
            item.save(update_fields=["qty", "unit_price_snapshot"])
        return Response(CartItemReadSerializer(item).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, item_id: int):
        cart = _get_or_create_cart(request.user)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        ser = CartItemPatchSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        item.qty = ser.validated_data["qty"]
        item.save(update_fields=["qty"])
        return Response(CartItemReadSerializer(item).data)

    def delete(self, request, item_id: int):
        cart = _get_or_create_cart(request.user)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
