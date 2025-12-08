# Integración de PayPal - Sistema de Pagos y Comisiones

## Resumen

Este documento describe cómo funciona la integración de PayPal en Perrify, incluyendo el modelo de comisiones y el flujo de dispersión de pagos.

## Modelo de Negocio

Perrify actúa como una **plataforma marketplace** que:
1. Recibe los pagos de los clientes finales
2. Retiene una comisión según el plan del negocio
3. Dispersa el resto del pago al negocio

## Estructura de Comisiones

### Plan Free
- **Comisión de plataforma**: 15%
- **Incluye**: Costos de PayPal/Stripe + Comisión de plataforma
- **Citas**: Máximo 30 al mes
- **Marketplace**: No publicado (solo URL directa)

### Plan Pro ($79/mes)
- **Comisión de plataforma**: 3%
- **Incluye**: Solo costos de PayPal/Stripe + mínima comisión
- **Citas**: Ilimitadas
- **Marketplace**: Publicado

## Flujo de Pago

### 1. Creación de Orden
```
Cliente → Perrify → PayPal API
```

**Endpoint**: `POST /api/paypal/create-order`

**Request**:
```json
{
  "amount": 100.00,
  "currency": "MXN",
  "businessId": "uuid",
  "appointmentId": "uuid"
}
```

**Response**:
```json
{
  "orderId": "paypal_order_id",
  "status": "CREATED"
}
```

### 2. Captura de Pago
```
PayPal → Perrify → Base de Datos
```

**Endpoint**: `POST /api/paypal/capture-order`

**Request**:
```json
{
  "orderId": "paypal_order_id"
}
```

**Response**:
```json
{
  "success": true,
  "orderId": "paypal_order_id",
  "captureId": "paypal_capture_id",
  "amount": 100.00,
  "commission": 15.00,
  "payout": 85.00,
  "plan": "free"
}
```

## Ejemplo de Cálculo de Comisiones

### Plan Free - Pago de $100 MXN

```
Monto total:          $100.00
Comisión (15%):       $ 15.00
Pago al negocio:      $ 85.00
```

### Plan Pro - Pago de $100 MXN

```
Monto total:          $100.00
Comisión (3%):        $  3.00
Pago al negocio:      $ 97.00
```

## Dispersión de Pagos (Payouts)

Para dispersar los pagos a los negocios, puedes usar **PayPal Payouts API**:

### Configuración Adicional Necesaria

1. Solicitar acceso a PayPal Payouts en tu cuenta de PayPal Business
2. Los negocios deben proporcionar su email de PayPal
3. Guardar el email de PayPal en la tabla `businesses`

### Endpoint de Dispersión (Próximamente)

```typescript
POST /api/paypal/payout

{
  "businessId": "uuid",
  "amount": 85.00,
  "currency": "MXN",
  "paypalEmail": "business@example.com"
}
```

## Variables de Entorno

```env
PAYPAL_CLIENT_ID=tu_client_id
PAYPAL_CLIENT_SECRET=tu_client_secret
PAYPAL_MODE=sandbox  # o 'production'
```

## Campos de Base de Datos Necesarios

### Tabla `businesses`
- `plan`: 'free' | 'pro'
- `paypal_email`: string (para recibir dispersiones)

### Tabla `appointments`
- `payment_status`: 'pending' | 'completed' | 'failed'
- `payment_method`: 'paypal' | 'stripe' | 'cash'
- `payment_amount`: decimal
- `platform_commission`: decimal
- `business_payout`: decimal
- `paypal_order_id`: string
- `paypal_capture_id`: string
- `paid_at`: timestamp

## Próximos Pasos

1. **Implementar PayPal Payouts**: Para automatizar la dispersión de pagos
2. **Dashboard de Analytics**: Mostrar comisiones y ganancias
3. **Reportes**: Generar reportes mensuales de pagos y comisiones
4. **Webhooks**: Implementar webhooks de PayPal para notificaciones en tiempo real

## Testing en Sandbox

1. Usa las credenciales de sandbox proporcionadas
2. Crea cuentas de prueba en PayPal Developer
3. Simula pagos usando cuentas de prueba de PayPal

## Producción

Para ir a producción:

1. Cambia `PAYPAL_MODE=production`
2. Actualiza las credenciales a las de producción
3. Verifica que tu cuenta de PayPal Business esté verificada
4. Solicita acceso a Payouts API si aún no lo tienes
