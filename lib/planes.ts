export type PlanData = {
  sku: string
  nombre: string
  subtitulo: string
  setup: number
  mensual: number
  color: string        // accent color hex
  incluye: { seccion: string; items: string[] }[]
  limites: [string, string][]
  soporte: [string, string][]
  implementacion: string[]
  extras: [string, string][]
  noIncluye: string[]
  condiciones: string[]
}

export const PLANES: Record<string, PlanData> = {
  'ROD-PLN-ST-01': {
    sku: 'ROD-PLN-ST-01',
    nombre: 'Plan Lía',
    subtitulo: 'Asistente Inteligente',
    setup: 50,
    mensual: 65,
    color: '#33b6ff',
    incluye: [
      {
        seccion: 'Funcionalidad principal',
        items: [
          'Respuestas automáticas con inteligencia artificial',
          'Atención a clientes 24/7',
          'Hasta 10 preguntas frecuentes configuradas',
          'Respuestas personalizadas según su negocio',
        ],
      },
      {
        seccion: 'Canal',
        items: ['Integración con WhatsApp'],
      },
      {
        seccion: 'Gestión de citas',
        items: [
          'Registro de hasta 99 citas mensuales',
          'Resumen diario por email con las citas',
        ],
      },
      {
        seccion: 'Implementación',
        items: [
          'Configuración completa del chatbot',
          'Ajuste del prompt para su negocio',
          'Conexión con WhatsApp',
          'Tiempo de entrega: 24 a 72 horas',
        ],
      },
    ],
    limites: [
      ['Conversaciones mensuales', '200'],
      ['Flujos conversacionales', '1'],
      ['Preguntas configuradas', 'Hasta 10'],
      ['Cambios incluidos/mes', '2'],
      ['Cambio adicional', '$15'],
    ],
    soporte: [
      ['Tiempo de respuesta', 'Hasta 6 horas'],
      ['Horario', 'Lun–Vie 8am–5pm'],
    ],
    implementacion: [
      'Configuración completa del chatbot',
      'Ajuste del prompt para su negocio',
      'Conexión con WhatsApp',
      'Tiempo de entrega: 24 a 72 horas',
    ],
    extras: [
      ['+50 conversaciones adicionales', '$14.99'],
      ['+15 preguntas adicionales', '$9.99'],
      ['+10 citas adicionales', '$9.99'],
      ['Idioma adicional (inglés)', '$9.99/mes'],
      ['Canal adicional (Instagram, Facebook, TikTok)', '$14.99/mes'],
    ],
    noIncluye: [
      'Captura avanzada de leads',
      'Confirmación o cancelación de citas',
      'Automatizaciones',
      'Integraciones con CRM',
      'Atención humana o desvío a agente',
      'Respuestas a mensajes de voz o imágenes',
      'Desarrollo personalizado',
      'Soporte fuera de horario',
      'Cambios urgentes (menos de 24h)',
    ],
    condiciones: [
      'Uso sujeto a política de uso justo.',
      'Los cambios deben solicitarse con 24 horas de anticipación.',
      'No incluye acceso al sistema interno de RODAI.',
      '1 conversación = interacción por cliente en un período de 24 horas.',
    ],
  },

  'ROD-PLN-BU-01': {
    sku: 'ROD-PLN-BU-01',
    nombre: 'Plan Elian',
    subtitulo: 'Generación de Clientes',
    setup: 100,
    mensual: 129,
    color: '#8f4cff',
    incluye: [
      {
        seccion: 'Funcionalidad principal',
        items: [
          'Todo lo del Plan Lía +',
          'Captura de datos de clientes (leads)',
          'Identificación de intención de compra',
          'Respuestas más avanzadas y personalizadas',
          'Hasta 2 flujos conversacionales',
        ],
      },
      {
        seccion: 'Canal',
        items: ['Integración con WhatsApp'],
      },
      {
        seccion: 'Gestión de leads',
        items: ['Captura de hasta 100 leads mensuales'],
      },
      {
        seccion: 'Implementación',
        items: [
          'Configuración de flujos',
          'Configuración de captura de leads',
          'Entrenamiento inicial del sistema',
          'Tiempo de entrega: 24 a 72 horas',
        ],
      },
    ],
    limites: [
      ['Conversaciones mensuales', '300'],
      ['Flujos conversacionales', '2'],
      ['Preguntas configuradas', 'Hasta 25'],
      ['Leads mensuales', 'Hasta 100'],
      ['Cambios incluidos/mes', '3'],
      ['Cambio adicional', '$15'],
    ],
    soporte: [
      ['Tiempo de respuesta', 'Hasta 3 horas'],
      ['Lunes a viernes', '8am–5pm'],
      ['Sábados', '8am–12pm (incidencias)'],
    ],
    implementacion: [
      'Configuración de flujos',
      'Configuración de captura de leads',
      'Entrenamiento inicial del sistema',
      'Tiempo de entrega: 24 a 72 horas',
    ],
    extras: [
      ['+50 conversaciones', '$14.99'],
      ['+15 preguntas', '$9.99'],
      ['+50 leads', '$9.99'],
      ['Idioma adicional (inglés)', '$9.99/mes'],
      ['Canal adicional (Instagram, Facebook, TikTok)', '$14.99/mes'],
      ['Flujo adicional', '$25'],
    ],
    noIncluye: [
      'Agendamiento automático de citas',
      'Confirmación o cancelación de citas',
      'Automatizaciones',
      'Integraciones complejas o CRM',
      'Atención humana o desvío a agente',
      'Respuestas a mensajes de voz o imágenes',
      'Desarrollo personalizado',
      'Soporte fuera de horario',
      'Cambios urgentes (menos de 24h)',
    ],
    condiciones: [
      'Uso sujeto a política de uso justo.',
      'Los cambios deben solicitarse con 24 horas de anticipación.',
      'No incluye acceso al sistema interno de RODAI.',
      '1 conversación = interacción por cliente en un período de 24 horas.',
    ],
  },

  'ROD-PLN-PR-01': {
    sku: 'ROD-PLN-PR-01',
    nombre: 'Plan PRO',
    subtitulo: 'Automatización de Ventas',
    setup: 300,
    mensual: 249,
    color: '#29d17d',
    incluye: [
      {
        seccion: 'Funcionalidad principal',
        items: [
          'Todo lo del Plan Elian +',
          'Agendamiento automático de citas',
          'Registro y gestión de clientes (CRM básico)',
          'Seguimiento automático (recordatorios)',
          'Automatizaciones',
          'Integraciones básicas (ej. Google Sheets)',
          'Hasta 4 flujos conversacionales',
        ],
      },
      {
        seccion: 'Canal',
        items: ['Integración con WhatsApp'],
      },
      {
        seccion: 'Gestión',
        items: [
          'Hasta 300 leads mensuales',
          'Hasta 300 citas mensuales',
        ],
      },
      {
        seccion: 'Implementación',
        items: [
          'Configuración completa del sistema',
          'Automatizaciones base',
          'Integraciones',
          'Entrenamiento personalizado',
          'Tiempo de entrega: 48 a 96 horas',
        ],
      },
    ],
    limites: [
      ['Conversaciones mensuales', '800'],
      ['Flujos conversacionales', '4'],
      ['Preguntas configuradas', 'Hasta 50'],
      ['Leads mensuales', 'Hasta 300'],
      ['Citas mensuales', 'Hasta 300'],
      ['Cambios incluidos/mes', '5'],
      ['Cambio adicional', '$20'],
    ],
    soporte: [
      ['Tiempo de respuesta', '1 a 2 horas'],
      ['Lunes a viernes', '8am–5pm'],
      ['Sábados', '8am–2pm'],
    ],
    implementacion: [
      'Configuración completa del sistema',
      'Automatizaciones base',
      'Integraciones',
      'Entrenamiento personalizado',
      'Tiempo de entrega: 48 a 96 horas',
    ],
    extras: [
      ['+50 conversaciones', '$12.99'],
      ['+15 preguntas', '$9.99'],
      ['+50 leads', '$9.99'],
      ['+10 citas', '$9.99'],
      ['Idioma adicional (inglés)', '$9.99/mes'],
      ['Canal adicional (Instagram, Facebook, TikTok)', '$14.99/mes'],
      ['Flujo adicional', '$30'],
    ],
    noIncluye: [
      'Desarrollo a medida complejo',
      'Integraciones personalizadas avanzadas',
      'Atención humana',
      'Soporte 24/7',
      'Cambios urgentes fuera de horario',
      'Respuestas a mensajes de voz o imágenes',
    ],
    condiciones: [
      'Uso sujeto a política de uso justo.',
      'Los cambios deben solicitarse con 24 horas de anticipación.',
      'No incluye acceso al sistema interno de RODAI.',
      '1 conversación = interacción por cliente en un período de 24 horas.',
    ],
  },
}
