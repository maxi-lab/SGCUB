from decimal import Decimal

CHARGE_PRIORITY = ("Mora", "CuotaSocial", "CuotaDeportiva", "Otro")
ZERO = Decimal("0.00")


def charge_order(concept):
    return CHARGE_PRIORITY.index(concept) if concept in CHARGE_PRIORITY else len(CHARGE_PRIORITY)


def concept_totals(items):
    charges, discounts = {}, {}
    for concept, amount, is_discount in items:
        target = discounts if is_discount else charges
        target[concept] = target.get(concept, ZERO) + amount
    return charges, discounts


def allocate_payment(charges, discounts, allocated, amount):
    lines = {}
    for concept, total in discounts.items():
        pending = total + allocated.get(concept, ZERO)
        if pending > 0:
            lines[concept] = -pending

    to_distribute = amount - sum(lines.values(), ZERO)
    for concept in sorted(charges, key=charge_order):
        remaining = charges[concept] - allocated.get(concept, ZERO)
        part = min(remaining, to_distribute)
        if part > 0:
            lines[concept] = part
            to_distribute -= part
    return lines
