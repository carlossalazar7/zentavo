# Zentavo SV — Gestión Financiera Inteligente y Control de Deudas

**Zentavo SV** es una plataforma web integral de finanzas personales diseñada para tomar el control total de los ingresos, registrar gastos detallados (incluyendo compras en cuotas), proyectar la liquidación acelerada de deudas mediante métodos matemáticos (Bola de Nieve y Avalancha), optimizar la distribución salarial y recibir asesoría financiera personalizada impulsada por Inteligencia Artificial (Google Gemini).

---

## 🚀 Características Principales

### 1. 📊 Panel de Control Financiero (Dashboard)
- **Cálculo de Flujo Libre Real:** Descuenta tanto los gastos operativos (necesidades y deseos) como las cuotas mensuales comprometidas de deudas para reflejar la disponibilidad real para ahorro o emergencias.
- **Semáforo de Ratio de Endeudamiento (DTI):** Monitoreo del porcentaje del sueldo destinado a deuda (Saludable < 30%, Precaución 30-40%, Alerta > 40%).
- **Detección de Fugas de Dinero:** Identificación automática de gastos hormiga y suscripciones recurrentes.
- **Gráficos y Métricas Clave:** Distribución visual de ingresos vs. compromisos y comparativas de presupuesto.

### 2. 💳 Registro y Control de Gastos con Soporte de Cuotas
- **Soporte Completo para Compras en Cuotas:**
  - Identificación de compras financiadas con tarjeta de crédito o préstamos.
  - Asignación de cuota actual vs. total de cuotas (ej. *Cuota 1 de 6*).
  - Cálculo automático entre monto total original y valor mensual de la cuota.
  - Filtro dedicado para transacciones en cuotas frente a pagos al contado/débito.
- **Entrada Inteligente:**
  - Registro manual con categorización rápida (Necesidades, Deseos, Deudas).
  - Parser en lenguaje natural con IA (ej: *"Ayer gasté 45 en combustible con tarjeta"*).
  - Escaneo OCR de recibos e imágenes de tickets de compra.
- **Exportación y Reportes:** Descarga de movimientos en formato CSV y generación de resumen imprimible.

### 3. 🏔️ Gestor y Estrategias de Liquidación de Deudas
- **Simulador Bola de Nieve (*Snowball*):** Prioriza liquidar primero las deudas de menor saldo para generar victorias psicológicas rápidas.
- **Simulador Avalancha (*Avalanche*):** Prioriza las deudas con mayor tasa de interés (TIR/APR) para minimizar el costo financiero total.
- **Simulación de Pagos Extraordinarios:** Visualiza el ahorro en intereses y los meses que reduces al aportar pagos adicionales.
- **Control de Abonos:** Registro histórico de pagos y amortización de capital.

### 4. 💵 Distribuidor de Sueldo
- **Modelos de Presupuesto:**
  - Regla clásica **50/30/20** (Necesidades / Deseos / Ahorro y Deudas).
  - Regla **70/20/10** o porcentajes 100% personalizados por sobres.
- **Asignación por Cuentas:** Guía paso a paso para repartir cada pago de nómina apenas se recibe.

### 5. ✂️ Plan de Reducción de Costos
- Auditoría guiada para recortar gastos superfluos y renegociar servicios.
- Cálculo de impacto y ahorro proyectado anualizado.

### 6. 🤖 Asesor Financiero IA (Gemini)
- Chat interactivo que analiza en tiempo real tu perfil financiero, nivel de endeudamiento y hábitos de gasto para brindarte recomendaciones prácticas y planes de acción concretos.

### 7. 👥 Multi-Perfil y Respaldo
- Creación de múltiples perfiles independientes (Personal, Negocio, Familiar).
- Configuración de monedas (USD `$`, EUR `€`, PEN `S/`, MXN `$`, etc.).
- Copias de seguridad: Exportación e importación de datos en formato JSON para no perder información.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Animaciones e Iconos:** [Motion](https://motion.dev/), [Lucide React](https://lucide.dev/)
- **Backend & Servidor:** [Express](https://expressjs.com/), [Node.js](https://nodejs.org/), [tsx](https://github.com/privatenumber/tsx), [esbuild](https://esbuild.github.io/)
- **Inteligencia Artificial:** [@google/genai](https://www.npmjs.com/package/@google/genai) con modelos Gemini

---

## 📦 Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js** v18 o superior
- Gestor de paquetes **npm** o **bun**

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone <URL_DEL_REPOSITORIO>
cd zentavo-sv
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
GEMINI_API_KEY=tu_api_key_de_gemini
```

> *Nota: Obtén tu clave gratuita en [Google AI Studio](https://aistudio.google.com/).*

### 3. Iniciar en modo desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### 4. Compilación para producción
```bash
npm run build
npm start
```

---

## 📁 Estructura del Proyecto

```text
├── index.html                  # Entrada HTML principal
├── server.ts                   # Servidor Express con proxies de IA y Vite middleware
├── src/
│   ├── App.tsx                 # Enrutamiento, navegación y estado global de perfiles
│   ├── types.ts                # Interfaces y tipos de TypeScript
│   ├── components/             # Vistas y componentes modulares
│   │   ├── DashboardView.tsx           # Panel principal de métricas y DTI
│   │   ├── ExpenseTrackerView.tsx      # Registro de gastos, cuotas y OCR
│   │   ├── DebtManagerView.tsx         # Estrategias Snowball / Avalanche
│   │   ├── SalaryDistributorView.tsx   # Distribución de ingresos 50/30/20
│   │   ├── CostReductionView.tsx       # Plan de recorte de costos
│   │   ├── AiChatAdvisor.tsx           # Asesor conversacional con Gemini
│   │   ├── Navbar.tsx                  # Barra de navegación principal
│   │   ├── ProfileModal.tsx            # Edición de sueldos y moneda
│   │   └── ProfileSelector.tsx         # Selector y gestor de perfiles
│   ├── data/
│   │   └── defaultData.ts              # Datos iniciales y ejemplos preconfigurados
│   └── utils/
│       ├── financeCalculators.ts       # Fórmulas de DTI, Snowball, cuotas y métricas
│       └── storage.ts                  # Persistencia y respaldos locales
```

---

## 🔒 Privacidad y Almacenamiento

Todos los registros financieros, deudas y movimientos se almacenan de forma local en el navegador del usuario (`localStorage`). Las consultas realizadas al asesor de IA son enviadas de forma segura a través del servidor backend utilizando la API de Google Gemini sin exponer credenciales en el cliente.
