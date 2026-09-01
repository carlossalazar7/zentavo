import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint: AI Financial Diagnosis & Custom Salary Distribution
app.post('/api/ai/diagnose', async (req, res) => {
  try {
    const { salary, extraIncome, expenses, debts, currency, period, profileType, profileName } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Servicio de IA no configurado',
        fallback: true,
        message: 'No se detectó API Key para Gemini. Por favor configure GEMINI_API_KEY en los secretos.'
      });
    }

    const ai = getAi();

    const isBusiness = profileType === 'Empresa';
    const isFreelance = profileType === 'Trabajo';

    const roleDescription = isBusiness
      ? 'Actúa como un Consultor Financiero y CFO Estratégico para Empresas, Negocios y PyMEs.'
      : isFreelance
      ? 'Actúa como un Asesor Financiero experto para Trabajadores Independientes, Freelancers y Profesionales.'
      : 'Actúa como un Asesor Financiero y Coach de Presupuesto Personal experto y empático.';

    const prompt = `${roleDescription}
Analiza con rigor matemático y sentido práctico la situación financiera de este perfil "${profileName || 'Principal'}" (Tipo: ${profileType || 'Personal'}):

DATOS FINANCIEROS:
- ${isBusiness ? 'Facturación Neta Mensual' : 'Sueldo neto mensual'}: ${currency} ${salary}
- ${isBusiness ? 'Cobranzas o Ingresos secundarios' : 'Ingresos extras mensuales'}: ${currency} ${extraIncome || 0}
- Ingreso total mensual: ${currency} ${(Number(salary) || 0) + (Number(extraIncome) || 0)}
- Moneda: ${currency}
- Periodo analizado: ${period || 'Mes actual'}

LISTA DE GASTOS REGISTRADOS:
${JSON.stringify(expenses, null, 2)}

LISTA DE DEUDAS REGISTRADAS:
${JSON.stringify(debts, null, 2)}

TAREA:
1. Evalúa el ratio de endeudamiento (DTI: Pagos mensuales de deuda / Ingresos netos) y la carga total de deuda.
2. Identifica con precisión fugas de dinero (${isBusiness ? 'gastos operativos redundantes, sobrecostos de proveedores, suscripciones de software sin uso' : 'gastos hormiga, suscripciones innecesarias, sobregasto en ocio'}).
3. Propón un plan de distribución ajustado a su realidad (${isBusiness ? 'Costos Operativos Esenciales %, Gastos de Crecimiento/Marketing %, Pasivos/Deudas Comerciales %, Fondo de Reserva Operativo %' : 'Regla 50/30/20 o adaptada'}).
4. Elige la mejor estrategia de pago de deudas (${isBusiness ? 'Pasivos de mayor costo financiero primero o consolidación comercial' : 'Bola de Nieve vs Avalancha'}).
5. Brinda recomendaciones prácticas y realistas para optimizar costos de inmediato.

Responde estrictamente en formato JSON según el esquema especificado.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: `Eres un asesor financiero experto y pedagógico en idioma español para perfiles de tipo ${profileType || 'Personal'}. Tu misión es devolver análisis realistas, números precisos y pasos accionables sin tecnicismos innecesarios.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAssessment: {
              type: Type.STRING,
              description: 'Resumen ejecutivo claro y motivador de la situación financiera del usuario.'
            },
            debtRiskLevel: {
              type: Type.STRING,
              description: 'Nivel de riesgo de endeudamiento: "Saludable" | "Moderado" | "Alto Riesgo" | "Crítico"'
            },
            debtAnalysis: {
              type: Type.STRING,
              description: 'Explicación detallada del impacto de sus deudas sobre el sueldo y cómo afecta su tranquilidad.'
            },
            recommendedDebtStrategy: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'Bola de Nieve o Avalancha de Intereses' },
                explanation: { type: Type.STRING, description: 'Por qué esta estrategia es la más recomendada para su caso.' },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Pasos ordenados para liquidar las deudas.'
                }
              },
              required: ['name', 'explanation', 'steps']
            },
            salaryDistributionRecommendation: {
              type: Type.OBJECT,
              properties: {
                needsPercentage: { type: Type.NUMBER, description: 'Porcentaje sugerido para necesidades básicas (ej: 50)' },
                wantsPercentage: { type: Type.NUMBER, description: 'Porcentaje sugerido para deseos y ocio (ej: 15 o 20)' },
                debtPercentage: { type: Type.NUMBER, description: 'Porcentaje sugerido para pago acelerado de deudas (ej: 25 o 30)' },
                savingsPercentage: { type: Type.NUMBER, description: 'Porcentaje sugerido para fondo de emergencia / ahorro (ej: 5 o 10)' },
                rationale: { type: Type.STRING, description: 'Justificación de esta distribución personalizada según su sueldo y deudas.' }
              },
              required: ['needsPercentage', 'wantsPercentage', 'debtPercentage', 'savingsPercentage', 'rationale']
            },
            costCuttingOpportunities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: 'Categoría del gasto' },
                  title: { type: Type.STRING, description: 'Título de la oportunidad de ahorro' },
                  description: { type: Type.STRING, description: 'En qué consiste el recorte y cómo ejecutarlo sin sufrimiento.' },
                  estimatedMonthlySavings: { type: Type.NUMBER, description: 'Monto estimado que ahorraría al mes' },
                  difficulty: { type: Type.STRING, description: 'Fácil | Moderado | Esfuerzo' }
                },
                required: ['category', 'title', 'description', 'estimatedMonthlySavings', 'difficulty']
              },
              description: 'Lista de oportunidades concretas detectadas para reducir costos.'
            },
            immediateActionPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 a 5 acciones inmediatas que el usuario puede hacer esta misma semana.'
            }
          },
          required: [
            'overallAssessment',
            'debtRiskLevel',
            'debtAnalysis',
            'recommendedDebtStrategy',
            'salaryDistributionRecommendation',
            'costCuttingOpportunities',
            'immediateActionPlan'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/diagnose:', error);
    res.status(500).json({
      error: 'Error al procesar el diagnóstico con IA',
      details: error.message || 'Error desconocido'
    });
  }
});

// Endpoint: Financial AI Chat Advisor
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, financialContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Servicio de IA no configurado',
        message: 'No se detectó API Key para Gemini.'
      });
    }

    const ai = getAi();

    const profileType = financialContext?.profileType || 'Personal';
    const profileName = financialContext?.profileName || 'Principal';
    const isBusiness = profileType === 'Empresa';
    const isFreelance = profileType === 'Trabajo';

    const systemPrompt = `Eres un Asesor y Coach Financiero experto, inteligente, empático y práctico llamado "Coach Financiero Zentavo".
Estás interactuando con un usuario en su perfil "${profileName}" (Tipo de cuenta: ${profileType}).
${isBusiness ? 'Este perfil corresponde a una Empresa / Negocio / PyME. Enfócate en flujo de caja, optimización de costos operativos, margen de contribución, proveedores y sostenibilidad del negocio.' : isFreelance ? 'Este perfil corresponde a un Trabajo Independiente / Freelance. Enfócate en facturación por proyectos, reservas para impuestos, gastos deducibles y colchón para meses lentos.' : 'Este perfil corresponde a Finanzas Personales / Familiares. Enfócate en control de gastos del hogar, liquidar deudas de tarjetas y crear un fondo de emergencia sólido.'}

CONTEXTO FINANCIERO DEL USUARIO:
${JSON.stringify(financialContext, null, 2)}

INSTRUCCIONES DE RESPUESTA:
- Responde siempre en español, de forma clara, directa, comprensiva y estructurada con listas o viñetas.
- Haz cálculos matemáticos explícitos basados en sus ingresos (${financialContext.currency} ${financialContext.salary}) y sus deudas.
- Si el usuario te pregunta "¿puedo hacer este gasto o compra?", calcula el impacto porcentual y responde con honestidad constructiva.
- Proporciona consejos reales y accionables sin tecnicismos innecesarios.
- Sé motivador pero realista: prioriza siempre la solvencia y la eliminación de intereses caros.`;

    const chatContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: chatContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({
      error: 'Error al responder la consulta',
      details: error.message || 'Error desconocido'
    });
  }
});

// Endpoint: AI Quick Expense Parser (parse text like "almuerzo 850 con tarjeta de debito ayer")
app.post('/api/ai/parse-expense', async (req, res) => {
  try {
    const { text, currency } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY no disponible' });
    }

    const ai = getAi();
    const prompt = `Analiza el siguiente texto libre escrito por un usuario y extrae uno o varios gastos en formato estructurado.
Texto del usuario: "${text}"
Moneda por defecto: ${currency || 'USD'}
Fecha de referencia hoy: ${new Date().toISOString().split('T')[0]}

Categorías posibles:
- Alimentación (supermercado, comida rápida, delivery, restaurantes)
- Vivienda (alquiler, hipoteca, reparaciones)
- Servicios (luz, agua, gas, internet, telefonía)
- Transporte (combustible, metro, bus, uber, taxi, mantenimiento)
- Suscripciones (netflix, spotify, gimnasio, software)
- Entretenimiento y Salidas (cine, bares, hobbies)
- Deudas y Tarjetas (cuota de crédito, préstamo)
- Salud y Cuidado (farmacia, médico, higiene)
- Ropa y Calzado
- Educación
- Gastos Hormiga (café, golosinas, propinas, snacks)
- Otros

Tipo de gasto: "Necesidad", "Deseo", o "Deuda"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Título o concepto del gasto' },
              amount: { type: Type.NUMBER, description: 'Monto numérico positivo' },
              category: { type: Type.STRING, description: 'Categoría asignada' },
              type: { type: Type.STRING, description: 'Necesidad | Deseo | Deuda' },
              paymentMethod: { type: Type.STRING, description: 'Efectivo | Tarjeta de Débito | Tarjeta de Crédito | Transferencia' },
              date: { type: Type.STRING, description: 'Fecha en formato YYYY-MM-DD' },
              notes: { type: Type.STRING, description: 'Nota adicional o detalle' }
            },
            required: ['title', 'amount', 'category', 'type']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ expenses: parsed });
  } catch (error: any) {
    console.error('Error in /api/ai/parse-expense:', error);
    res.status(500).json({ error: error.message || 'Error al procesar el texto' });
  }
});

// Endpoint: AI OCR Receipt & Invoice Scanner
app.post('/api/ai/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', currency = 'USD', profileType = 'Personal' } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Servicio de IA no disponible',
        message: 'No se detectó API Key para Gemini en los secretos.'
      });
    }

    if (!imageBase64) {
      return res.status(400).json({ error: 'No se proporcionó la imagen del ticket o factura.' });
    }

    // Clean base64 prefix if provided (e.g. data:image/jpeg;base64,...)
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const ai = getAi();
    const isBusiness = profileType === 'Empresa';

    const prompt = `Analiza con alta precisión este ticket, factura, recibo o comprobante de pago comercial.
Extrae los siguientes datos financieros clave:
1. Nombre del comercio o emisor (merchant / store).
2. Fecha de emisión o compra en formato YYYY-MM-DD (si no se lee el año o solo día/mes, asume el año actual ${new Date().getFullYear()}).
3. Monto total pagado (numérico positivo).
4. Impuestos o propinas si están detallados.
5. Lista de productos o conceptos principales comprados (máximo 6 items resumidos).
6. Categoría más adecuada entre:
   - Alimentación y Supermercado
   - Vivienda y Alquiler
   - Servicios Básicos (Luz, Agua, Gas, Net)
   - Transporte y Movilidad
   - Salud y Medicamentos
   - Suscripciones y Apps
   - Restaurantes y Delivery
   - Entretenimiento, Salidas y Hobbies
   - Ropa y Calzado
   - Gastos Hormiga (Café, Snacks, Kiosco)
   - Educación y Cursos
   - ${isBusiness ? 'Costos Operativos y Proveedores' : 'Otros Imprevistos'}
7. Clasificación del gasto: "Necesidad" (comida esencial, medicina, servicios), "Deseo" (restaurantes, ocio, ropa no esencial) o "Deuda" (pago de tarjeta o crédito).
8. Método de pago detectado (Efectivo, Tarjeta de Débito, Tarjeta de Crédito, Transferencia).
9. Breve nota explicativa del recibo.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING, description: 'Nombre del establecimiento comercial' },
            date: { type: Type.STRING, description: 'Fecha en formato YYYY-MM-DD' },
            totalAmount: { type: Type.NUMBER, description: 'Monto total numérico pagado' },
            category: { type: Type.STRING, description: 'Categoría asignada' },
            type: { type: Type.STRING, description: 'Necesidad | Deseo | Deuda' },
            paymentMethod: { type: Type.STRING, description: 'Efectivo | Tarjeta de Débito | Tarjeta de Crédito | Transferencia' },
            taxAmount: { type: Type.NUMBER, description: 'Monto de impuestos o IVA si está visible' },
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Resumen de los principales productos o servicios'
            },
            notes: { type: Type.STRING, description: 'Resumen o notas adicionales detectadas en el ticket' },
            confidence: { type: Type.STRING, description: 'Alta | Media | Baja' }
          },
          required: ['merchant', 'totalAmount', 'category', 'type', 'date']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ result: parsed });
  } catch (error: any) {
    console.error('Error in /api/ai/scan-receipt:', error);
    res.status(500).json({
      error: 'Error al escanear el recibo con IA',
      details: error.message || 'Error desconocido'
    });
  }
});

// Vite / Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor financiero escuchando en http://0.0.0.0:${PORT}`);
  });
}

startServer();
