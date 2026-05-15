"""Mock payment gateway. Same shape as a real PSP (Culqi/MercadoPago) to make Phase 2 swap trivial."""
from dataclasses import dataclass
from decimal import Decimal

from .models import Payment


@dataclass
class GatewayResult:
    approved: bool
    reference: str
    raw: dict


class PaymentGatewayStub:
    """Aprueba siempre en sandbox excepto si method='card' y amount termina en .13 (regla didactica)."""

    def charge(self, *, method: str, amount: Decimal, currency: str = "PEN", metadata: dict | None = None) -> GatewayResult:
        ref = Payment.generate_reference()
        approved = True
        # regla: tarjetas con monto que termine en .13 -> rechazado, para probar el camino infeliz
        if method == "card" and str(amount).endswith(".13"):
            approved = False
        return GatewayResult(
            approved=approved,
            reference=ref,
            raw={"method": method, "amount": str(amount), "currency": currency, "metadata": metadata or {}},
        )
