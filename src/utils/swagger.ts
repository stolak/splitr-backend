import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { Express } from 'express';

const BUILD_DIR = process.env.BUILD_DIR ?? 'src';
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API with Prisma + JWT',
      version: '1.0.0',
      description: 'Express API with Prisma ORM, JWT auth, and Swagger docs',
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Bank', description: 'Bank management' },
      { name: 'BusinessCategory', description: 'Business category management' },
      { name: 'Buyer', description: 'Buyer management' },
      { name: 'Dashboard', description: 'Dashboard endpoints' },
      { name: 'Eligibility', description: 'Eligibility and score management' },
      { name: 'Email', description: 'Email management' },
      { name: 'Helper', description: 'Helper utilities' },
      { name: 'Invoice', description: 'Invoice management' },
      { name: 'Item', description: 'Item management' },
      { name: 'splitrId', description: 'splitr ID management' },
      { name: 'Loan', description: 'Loan management' },
      { name: 'LoanDebitTrial', description: 'Loan debit trial management' },
      { name: 'LoanPenalty', description: 'Loan penalty management' },
      {
        name: 'LoanPenaltySchedule',
        description: 'Loan penalty schedule management',
      },
      { name: 'LoanSetting', description: 'Loan settings management' },
      { name: 'LoanTransaction', description: 'Loan transaction management' },
      { name: 'Location', description: 'Location management' },
      { name: 'Merchant', description: 'Merchant management' },
      { name: 'Mono', description: 'Mono integration' },
      { name: 'Persona', description: 'Persona inquiry endpoints' },
      { name: 'Scoring', description: 'Scoring calculation endpoints' },
      { name: 'Upload', description: 'File upload management' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    servers: [{ url: process.env.API_URL || 'http://localhost:5002' }],
  },
  // Ensure all route and controller files are scanned
  apis: [
    // "src/routes/**/*.ts",
    // "src/routes/**/*.js",
    // "src/controllers/**/*.ts",
    // "src/controllers/**/*.js",
    `${BUILD_DIR}/routes/*`,
    `${BUILD_DIR}/controllers/*`,
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  const swaggerUiOptions = {
    swaggerOptions: {
      // Must use inline literals — this function is serialized and runs in the browser.
      tagsSorter: (a: { name?: string }, b: { name?: string }) => {
        const nameA = a?.name ?? String(a);
        const nameB = b?.name ?? String(b);
        if (nameA === 'Auth') return -1;
        if (nameB === 'Auth') return 1;
        return nameA.localeCompare(nameB);
      },
      operationsSorter: 'alpha',
      persistAuthorization: true,
    },
  };

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
}
