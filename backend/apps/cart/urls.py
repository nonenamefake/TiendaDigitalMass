from django.urls import path

from .views import CartItemDetailView, CartItemsView, CartStoreView, CartView

urlpatterns = [
    path("cart", CartView.as_view(), name="cart"),
    path("cart/store", CartStoreView.as_view(), name="cart-store"),
    path("cart/items", CartItemsView.as_view(), name="cart-items"),
    path("cart/items/<int:item_id>", CartItemDetailView.as_view(), name="cart-item-detail"),
]
