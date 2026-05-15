from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Cart
from apps.cart.serializers import CartSerializer

from .models import Order
from .serializers import CheckoutSerializer, OrderSerializer
from .services import cancel_order, checkout, confirm_mock_payment, repeat_order


class OrderListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Order.objects.filter(user=request.user).prefetch_related("items", "payment").select_related("store")
        return Response(OrderSerializer(qs, many=True).data)

    def post(self, request):
        ser = CheckoutSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        idem = request.headers.get("Idempotency-Key", "")
        order = checkout(
            user=request.user,
            cart=cart,
            delivery_mode=ser.validated_data["delivery_mode"],
            payment_method=ser.validated_data["payment_method"],
            address_id=ser.validated_data.get("address_id"),
            delivery_date=ser.validated_data.get("delivery_date"),
            delivery_slot=ser.validated_data.get("delivery_slot") or "",
            idempotency_key=idem,
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items", "payment").select_related("store")


class OrderCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk: int):
        order = Order.objects.filter(user=request.user, pk=pk).first()
        if not order:
            return Response({"detail": "Pedido no encontrado."}, status=404)
        order = cancel_order(order)
        return Response(OrderSerializer(order).data)


class OrderRepeatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk: int):
        order = Order.objects.filter(user=request.user, pk=pk).first()
        if not order:
            return Response({"detail": "Pedido no encontrado."}, status=404)
        cart = repeat_order(order)
        return Response(CartSerializer(cart).data)


class PaymentMockView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk: int):
        order = Order.objects.filter(user=request.user, pk=pk).first()
        if not order:
            return Response({"detail": "Pedido no encontrado."}, status=404)
        order = confirm_mock_payment(order)
        return Response(OrderSerializer(order).data)
