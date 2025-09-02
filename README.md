# Integration Use Case Template

This is a template for an application showcasing Workflow Execution capabilities using [Integration.app](https://integration.app) and [temporal.io](https://temporal.io). The app is built with Next.js.

## Prerequisites

- Node.js 18+ installed
- Integration.app workspace credentials (Workspace Key and Secret)
- mongoDB (for local workflow storage)
- Docker installed (to host temporal server)

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
# Copy the sample environment file
cp .env-sample .env
```

4. Edit `.env` and add your Integration.app credentials and other settings

You can find these credentials in your Integration.app workspace settings.

## Running the Application

1. Start the development server:

```bash
npm run dev
# or
yarn dev
```

2. Start temporal server:

```bash
npm run temporal:start
# or
yarn temporal:start
```

3. Start temporal worker:

```bash
npm run temporal:worker
# or
yarn temporal:worker
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser, to start the NextJS app.

5. Open [http://localhost:8080](http://localhost:8080) in your browser, to see temporal dashboard.

## License

MIT
