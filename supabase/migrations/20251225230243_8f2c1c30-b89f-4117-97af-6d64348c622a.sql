UPDATE orders 
SET refunded = true, 
    status = 'refunded', 
    refunded_at = now(),
    refund_amount = amount
WHERE id = '311ce35c-f21f-4082-ae88-8b2e097d04c7'