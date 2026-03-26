const config = {
  service: "personal-expense-tracker",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild"],
  provider: {
    name: "aws",
    runtime: "nodejs20.x",
    region: "${opt:region, 'us-east-1'}",
    stage: "${opt:stage, 'dev'}",
    environment: {
      JWT_SECRET: "${env:JWT_SECRET, 'change-me-to-a-long-random-string'}",
      JWT_ISSUER: "${env:JWT_ISSUER, 'pet-api'}",
      JWT_AUDIENCE: "${env:JWT_AUDIENCE, 'pet-web'}",
      ACCESS_TOKEN_TTL_SECONDS: "${env:ACCESS_TOKEN_TTL_SECONDS, '86400'}",
      USERS_TABLE: "${self:service}-${self:provider.stage}-users",
      CATEGORIES_TABLE: "${self:service}-${self:provider.stage}-categories",
      EXPENSES_TABLE: "${self:service}-${self:provider.stage}-expenses",
      EXPENSES_GSI1: "gsi1",
      CORS_ORIGIN: "${env:CORS_ORIGIN, '*'}",
      DYNAMODB_ENDPOINT: "${env:DYNAMODB_ENDPOINT, ''}"
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        Resource: [
          { "Fn::GetAtt": ["UsersTable", "Arn"] },
          { "Fn::GetAtt": ["CategoriesTable", "Arn"] },
          { "Fn::GetAtt": ["ExpensesTable", "Arn"] },
          {
            "Fn::Join": [
              "/",
              [{ "Fn::GetAtt": ["ExpensesTable", "Arn"] }, "index", "gsi1"]
            ]
          }
        ]
      }
    ],
    httpApi: {
      cors: {
        allowedOrigins: ["${env:CORS_ORIGIN, '*'}"],
        allowedHeaders: ["Content-Type", "Authorization"],
        allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowCredentials: false
      }
    }
  },
  functions: {
    signup: {
      handler: "src/handlers/auth.signup",
      events: [{ httpApi: { method: "POST", path: "/auth/signup" } }]
    },
    login: {
      handler: "src/handlers/auth.login",
      events: [{ httpApi: { method: "POST", path: "/auth/login" } }]
    },
    listCategories: {
      handler: "src/handlers/categories.list",
      events: [{ httpApi: { method: "GET", path: "/categories" } }]
    },
    createCategory: {
      handler: "src/handlers/categories.create",
      events: [{ httpApi: { method: "POST", path: "/categories" } }]
    },
    updateCategory: {
      handler: "src/handlers/categories.update",
      events: [{ httpApi: { method: "PATCH", path: "/categories/{categoryId}" } }]
    },
    deleteCategory: {
      handler: "src/handlers/categories.remove",
      events: [{ httpApi: { method: "DELETE", path: "/categories/{categoryId}" } }]
    },
    listExpenses: {
      handler: "src/handlers/expenses.list",
      events: [{ httpApi: { method: "GET", path: "/expenses" } }]
    },
    createExpense: {
      handler: "src/handlers/expenses.create",
      events: [{ httpApi: { method: "POST", path: "/expenses" } }]
    },
    updateExpense: {
      handler: "src/handlers/expenses.update",
      events: [{ httpApi: { method: "PATCH", path: "/expenses/{expenseId}" } }]
    },
    deleteExpense: {
      handler: "src/handlers/expenses.remove",
      events: [{ httpApi: { method: "DELETE", path: "/expenses/{expenseId}" } }]
    },
    reportByMonth: {
      handler: "src/handlers/reports.byMonth",
      events: [{ httpApi: { method: "GET", path: "/reports/by-month" } }]
    },
    reportByCategory: {
      handler: "src/handlers/reports.byCategory",
      events: [{ httpApi: { method: "GET", path: "/reports/by-category" } }]
    }
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      platform: "node",
      target: "node20",
      format: "cjs"
    }
  },
  resources: {
    Resources: {
      UsersTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.USERS_TABLE}",
          AttributeDefinitions: [{ AttributeName: "email", AttributeType: "S" }],
          KeySchema: [{ AttributeName: "email", KeyType: "HASH" }]
        }
      },
      CategoriesTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.CATEGORIES_TABLE}",
          AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "categoryId", AttributeType: "S" }
          ],
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "categoryId", KeyType: "RANGE" }
          ]
        }
      },
      ExpensesTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.EXPENSES_TABLE}",
          AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "expenseId", AttributeType: "S" },
            { AttributeName: "gsi1pk", AttributeType: "S" },
            { AttributeName: "gsi1sk", AttributeType: "S" }
          ],
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "expenseId", KeyType: "RANGE" }
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "gsi1",
              KeySchema: [
                { AttributeName: "gsi1pk", KeyType: "HASH" },
                { AttributeName: "gsi1sk", KeyType: "RANGE" }
              ],
              Projection: { ProjectionType: "ALL" }
            }
          ]
        }
      }
    }
  }
};

module.exports = config;

