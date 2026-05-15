from django.urls import path

from .views import OrderCancelView, OrderDetailView, OrderListCreateView, OrderRepeatView, PaymentMockView

urlpatterns = [
    path("orders", OrderListCreateView.as_view(), name="orders"),
    path("orders/<int:pk>", OrderDetailView.as_view(), name="order-detail"),
    path("orders/<int:pk>/cancel", OrderCancelView.as_view(), name="order-cancel"),
    path("orders/<int:pk>/repeat", OrderRepeatView.as_view(), name="order-repeat"),
    path("payments/<int:pk>/mock", PaymentMockView.as_view(), name="payment-mock"),
]
