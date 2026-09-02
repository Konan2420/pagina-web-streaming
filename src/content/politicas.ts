export const POLICY_LAST_UPDATED = "23 de agosto de 2026";

export type PolicySection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type PolicyDocument = {
  id:
    | "terminos"
    | "reembolsos"
    | "privacidad"
    | "renovacion"
    | "pagos"
    | "uso-aceptable";
  title: string;
  shortTitle: string;
  summary: string;
  sections: PolicySection[];
};

/**
 * Textos visibles de la sección Políticas. Mantén aquí cualquier ajuste futuro
 * de redacción, plazos o condiciones sin tener que modificar componentes.
 */
export const POLICY_DOCUMENTS: PolicyDocument[] = [
  {
    id: "terminos",
    title: "Términos y Condiciones",
    shortTitle: "Términos",
    summary: "Las reglas básicas para usar CMD Streaming, tu cuenta y tu billetera.",
    sections: [
      {
        heading: "Uso de CMD Streaming",
        paragraphs: [
          "CMD Streaming ofrece acceso a productos y servicios digitales publicados en la plataforma. Cada producto puede tener condiciones específicas de uso, duración, perfiles o dispositivos permitidos; revísalas antes de completar tu compra.",
          "La compra te autoriza a usar el servicio durante el periodo contratado. No otorga propiedad sobre cuentas, licencias, marcas ni contenidos de los proveedores.",
        ],
      },
      {
        heading: "Registro, edad y seguridad",
        paragraphs: [
          "Para comprar o administrar pedidos debes proporcionar datos reales de contacto y mantenerlos actualizados. Al registrarte confirmas que tienes al menos 18 años o que cuentas con autorización de tu madre, padre o tutor legal.",
          "Eres responsable de mantener segura tu contraseña, tu correo y el acceso a tu cuenta CMD Streaming. Avísanos cuanto antes por Soporte si detectas un uso no autorizado.",
        ],
      },
      {
        heading: "Billetera y uso correcto",
        paragraphs: [
          "El saldo acreditado en tu billetera se utiliza para compras dentro de la plataforma, conforme a los métodos y condiciones que se muestren al momento de recargar.",
          "Podemos suspender o cerrar una cuenta cuando existan indicios razonables de fraude, pagos no autorizados, suplantación, abuso de promociones, reventa no permitida, hostigamiento o incumplimiento de estas políticas.",
        ],
      },
    ],
  },
  {
    id: "reembolsos",
    title: "Política de Reembolsos y Garantía",
    shortTitle: "Reembolsos",
    summary: "Cómo funciona la garantía de los productos digitales y cómo solicitar ayuda.",
    sections: [
      {
        heading: "Plazo de garantía",
        paragraphs: [
          "Los productos digitales cuentan con una garantía de referencia de 24 a 72 horas desde la entrega. El plazo aplicable se mostrará en la publicación, comprobante o detalle de tu pedido y podrá variar según el producto.",
          "Durante ese plazo, CMD Streaming revisará el caso y, cuando corresponda, ofrecerá reposición, corrección del acceso o una alternativa equivalente. Los plazos y condiciones pueden actualizarse en cada producto.",
        ],
      },
      {
        heading: "Casos que cubre",
        paragraphs: ["La garantía puede aplicar cuando el acceso entregado no funciona desde el inicio o deja de funcionar por una causa ajena al comprador."],
        bullets: [
          "Cuenta caída o sin acceso dentro del plazo de garantía.",
          "Clave modificada por el proveedor o una situación técnica no causada por el comprador.",
          "Datos de acceso entregados de forma incompleta o con un error verificable.",
        ],
      },
      {
        heading: "Casos no cubiertos",
        paragraphs: ["No es posible asegurar reposición o reembolso cuando el problema se produce por un uso fuera de las indicaciones del producto."],
        bullets: [
          "Cambiar correo, contraseña, PIN, perfiles o métodos de recuperación de la cuenta.",
          "Compartir el acceso con más personas, perfiles o dispositivos de los permitidos.",
          "No seguir las instrucciones de activación, usar VPN cuando el producto lo prohíbe o incumplir las reglas del proveedor.",
        ],
      },
      {
        heading: "Cómo solicitar una revisión",
        paragraphs: [
          "Reporta el problema desde Pedidos o por Soporte, indicando tu número de pedido, el producto y una breve descripción. Podemos solicitar una captura o información adicional para verificar el caso.",
          "Los reembolsos aprobados se procesan por el medio disponible en la plataforma o como saldo, según la situación y el método de pago utilizado.",
        ],
      },
    ],
  },
  {
    id: "privacidad",
    title: "Política de Privacidad",
    shortTitle: "Privacidad",
    summary: "Qué datos usamos y cómo puedes gestionar tu información personal.",
    sections: [
      {
        heading: "Datos que recopilamos",
        paragraphs: [
          "Podemos recopilar tu correo electrónico, número de WhatsApp, nombre o identificador de perfil, historial de compras, saldo y datos necesarios para atender tus pedidos.",
          "No solicitamos información que no sea necesaria para operar la cuenta, verificar pagos, entregar productos o brindar soporte.",
        ],
      },
      {
        heading: "Para qué usamos tus datos",
        paragraphs: [
          "Usamos esta información para crear y proteger tu cuenta, procesar compras, acreditar recargas, entregar accesos, responder consultas y mejorar el servicio.",
          "También podemos enviarte avisos importantes sobre pedidos, renovaciones, seguridad o cambios en la plataforma. No utilizamos tus datos para fines ajenos a la operación de CMD Streaming.",
        ],
      },
      {
        heading: "Terceros y eliminación de datos",
        paragraphs: [
          "Cuando es necesario procesar un pago, algunos datos pueden ser tratados por las pasarelas o métodos de pago disponibles en la plataforma. Cada proveedor aplica sus propias medidas y políticas de privacidad.",
          "Puedes solicitar la actualización o eliminación de tus datos personales desde Soporte. Conservaremos únicamente la información que sea necesaria para cumplir obligaciones operativas, prevenir fraude o atender una transacción en curso.",
        ],
      },
    ],
  },
  {
    id: "renovacion",
    title: "Política de Renovación",
    shortTitle: "Renovación",
    summary: "La diferencia entre productos Renovables y No Renovables.",
    sections: [
      {
        heading: "Productos Renovables",
        paragraphs: [
          "El badge Renovable indica que el producto puede mantenerse activo mediante una renovación periódica, siempre que esté disponible y se cumplan las condiciones indicadas en su publicación.",
          "La renovación no se realiza automáticamente a menos que la plataforma lo indique expresamente. Antes del vencimiento te informaremos por los canales de contacto disponibles para que puedas confirmar la continuidad.",
        ],
      },
      {
        heading: "Productos No Renovables",
        paragraphs: [
          "El badge No Renovable indica que el acceso vence definitivamente en la fecha señalada. No incluye promesa de extensión, continuidad ni migración a otra cuenta al finalizar el periodo.",
          "Si quieres seguir usando el servicio después de esa fecha, deberás revisar las opciones disponibles en el catálogo y realizar una nueva compra si existe disponibilidad.",
        ],
      },
      {
        heading: "Avisos de vencimiento",
        paragraphs: [
          "Los avisos pueden enviarse por la plataforma, correo o WhatsApp registrados. Mantén tus datos actualizados y revisa la fecha de vencimiento en tu pedido.",
          "La falta de respuesta a un aviso no garantiza la reserva del acceso ni de la tarifa anterior.",
        ],
      },
    ],
  },
  {
    id: "pagos",
    title: "Política de Pagos y Recarga de Saldo",
    shortTitle: "Pagos",
    summary: "Información sobre pagos, acreditación de saldo y comprobaciones pendientes.",
    sections: [
      {
        heading: "Métodos y confirmación",
        paragraphs: [
          "Puedes usar los métodos de pago disponibles en la plataforma al momento de realizar una compra o recarga. La disponibilidad puede variar según el proveedor, la ubicación y los controles de seguridad.",
          "Una operación se considera confirmada cuando el sistema o la pasarela de pago registra correctamente la transacción.",
        ],
      },
      {
        heading: "Acreditación del saldo",
        paragraphs: [
          "La mayoría de recargas se acredita en pocos minutos. Algunas operaciones pueden requerir revisión adicional y tardar más tiempo, especialmente si el proveedor de pago reporta una validación pendiente.",
          "No compartas comprobantes, códigos de seguridad ni datos bancarios en canales no oficiales.",
        ],
      },
      {
        heading: "Pago no reflejado",
        paragraphs: [
          "Si tu pago o recarga no se refleja después del tiempo informado, revisa primero el estado de la operación en tu método de pago. Luego contáctanos por Soporte con el comprobante, fecha, monto y correo asociado a tu cuenta.",
          "No dupliques el pago mientras el primer movimiento esté en revisión; así evitamos cargos innecesarios.",
        ],
      },
    ],
  },
  {
    id: "uso-aceptable",
    title: "Política de Uso Aceptable de Cuentas Compartidas",
    shortTitle: "Uso aceptable",
    summary: "Reglas para conservar tu acceso y la garantía de productos compartidos.",
    sections: [
      {
        heading: "Perfiles y dispositivos permitidos",
        paragraphs: [
          "Cada producto especifica cuántos perfiles, pantallas o dispositivos pueden usarse. Respeta siempre ese límite y utiliza únicamente el perfil asignado cuando corresponda.",
          "No compartas la cuenta fuera de tu grupo autorizado ni intentes usar simultáneamente más pantallas de las incluidas en tu plan.",
        ],
      },
      {
        heading: "Datos que no debes modificar",
        paragraphs: [
          "Para proteger la continuidad del servicio, no cambies el correo, contraseña, PIN, teléfono, perfiles, métodos de pago ni opciones de recuperación de la cuenta entregada.",
          "Tampoco elimines perfiles de otros usuarios, cierres sesiones ajenas ni alteres configuraciones que no te correspondan.",
        ],
      },
      {
        heading: "Incumplimientos",
        paragraphs: [
          "El incumplimiento de estas reglas puede provocar el cierre del acceso por parte del proveedor. En esos casos se pierde la garantía y CMD Streaming podrá suspender futuras compras o el acceso a la cuenta de usuario.",
          "Si tienes dudas sobre un límite o una configuración, consulta por Soporte antes de hacer cambios.",
        ],
      },
    ],
  },
];
