export async function helloWorldWorkflow(): Promise<string> {
  return 'Hello, World! Updated at ' + new Date().toLocaleTimeString()
}
