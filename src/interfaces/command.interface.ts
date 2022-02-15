export interface ICommand<T = any> {
  commandName: string;
  commandDescription: string;
  commandParams: string[];
  execute(payload: T, args: string[]): Promise<any>;
}
